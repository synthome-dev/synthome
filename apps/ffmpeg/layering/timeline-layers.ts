import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";
import type { LayerMediaOptions } from "../core/types";
import { isVideoFile } from "../core/utils";
import { ensureEven } from "../dimensions/calculator";
import { probeDimensions } from "../dimensions/probe";
import {
  stitchBackgrounds,
  type BackgroundSegment,
} from "./background-stitcher";
import { processLayers } from "./layers";

/**
 * Process timeline layers - when backgrounds/overlays change over time
 * New approach: Stitch backgrounds first, then overlay main video once (no blinking!)
 */
export async function processTimelineLayers(
  options: LayerMediaOptions,
  tempFiles: string[],
  outputPath: string
): Promise<Buffer> {
  console.log(
    "[Timeline] Processing timeline layers with background stitching"
  );

  // Find the main layer (the layer with main: true, or the first non-timeline video)
  let mainLayerIndex = -1;
  let mainLayerDuration = 0;
  let mainLayerPath = "";

  for (let i = 0; i < options.layers.length; i++) {
    const layer = options.layers[i];
    if ("isTimeline" in layer && layer.isTimeline) {
      continue; // Skip timeline layers
    }

    if (layer.main || mainLayerIndex === -1) {
      mainLayerIndex = i;
      // Download and probe the main layer to get its duration
      const response = await fetch(layer.media[0]);
      if (!response.ok) {
        throw new Error(
          `Failed to download main layer: ${response.statusText}`
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const isVideo = isVideoFile(layer.media[0]);
      const ext = isVideo ? "mp4" : "jpg";
      const path = join(tmpdir(), `${nanoid()}.${ext}`);
      await Bun.write(path, buffer);
      tempFiles.push(path);
      mainLayerPath = path;

      const metadata = await probeDimensions(path);
      if (metadata.duration) {
        mainLayerDuration = metadata.duration;
        console.log(
          `[Timeline] Main layer (${i}) duration: ${mainLayerDuration}s`
        );
      }

      if (layer.main) {
        break; // Found the explicitly marked main layer
      }
    }
  }

  if (mainLayerIndex === -1) {
    throw new Error(
      "No main layer found - at least one regular (non-timeline) layer required"
    );
  }

  // Auto-calculate durations for timeline items that don't have explicit durations
  for (const layer of options.layers) {
    if ("isTimeline" in layer && layer.isTimeline) {
      // Check if this timeline needs auto-duration
      const itemsWithoutDuration = layer.timeline.filter(
        (item) => !item.duration
      );

      if (itemsWithoutDuration.length > 0) {
        console.log(
          `[Timeline] Auto-calculating durations for ${itemsWithoutDuration.length} items`
        );

        // Calculate total duration of items that DO have explicit durations
        const explicitDuration = layer.timeline.reduce(
          (sum, item) => sum + (item.duration || 0),
          0
        );

        // Remaining duration to split among items without duration
        const remainingDuration = mainLayerDuration - explicitDuration;

        if (remainingDuration <= 0) {
          throw new Error(
            `Timeline items with explicit durations (${explicitDuration}s) exceed main layer duration (${mainLayerDuration}s)`
          );
        }

        // Split remaining duration evenly
        const autoDuration = remainingDuration / itemsWithoutDuration.length;

        console.log(
          `[Timeline] Auto-duration: ${autoDuration}s per item (${remainingDuration}s / ${itemsWithoutDuration.length} items)`
        );

        // Assign auto-calculated durations
        for (const item of layer.timeline) {
          if (!item.duration) {
            item.duration = autoDuration;
          }
        }
      }

      // Validate total timeline duration matches main layer
      const totalTimelineDuration = layer.timeline.reduce(
        (sum, item) => sum + (item.duration || 0),
        0
      );

      console.log(
        `[Timeline] Total timeline duration: ${totalTimelineDuration}s, Main layer: ${mainLayerDuration}s`
      );
    }
  }

  // Determine maximum background dimensions across all timeline items
  let maxWidth = 0;
  let maxHeight = 0;

  console.log(
    "[Timeline] Probing all timeline media to find max dimensions..."
  );

  // Store downloaded media paths for each timeline layer
  const timelineMediaCache = new Map<
    string,
    { path: string; isVideo: boolean; width: number; height: number }
  >();

  for (const layer of options.layers) {
    if ("isTimeline" in layer && layer.isTimeline) {
      for (const item of layer.timeline) {
        const mediaUrl = item.media[0];

        // Skip if already cached
        if (timelineMediaCache.has(mediaUrl)) {
          const cached = timelineMediaCache.get(mediaUrl)!;
          if (cached.width > maxWidth) maxWidth = cached.width;
          if (cached.height > maxHeight) maxHeight = cached.height;
          continue;
        }

        // Download and probe this timeline item
        const response = await fetch(mediaUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to download timeline media: ${response.statusText}`
          );
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const isVideo = isVideoFile(mediaUrl);
        const ext = isVideo ? "mp4" : mediaUrl.endsWith(".png") ? "png" : "jpg";
        const path = join(tmpdir(), `${nanoid()}.${ext}`);
        await Bun.write(path, buffer);
        tempFiles.push(path);

        const dims = await probeDimensions(path);
        console.log(
          `[Timeline] Media dimensions: ${dims.width}x${dims.height}`
        );

        // Cache it
        timelineMediaCache.set(mediaUrl, {
          path,
          isVideo,
          width: dims.width,
          height: dims.height,
        });

        if (dims.width > maxWidth) maxWidth = dims.width;
        if (dims.height > maxHeight) maxHeight = dims.height;
      }
    }
  }

  // If no explicit output size, use the maximum found
  // Ensure dimensions are even for FFmpeg libx264/yuv420p compatibility
  const outputWidth = ensureEven(options.outputWidth || maxWidth);
  const outputHeight = ensureEven(options.outputHeight || maxHeight);

  console.log(
    `[Timeline] Using output resolution: ${outputWidth}x${outputHeight} (max from all backgrounds)`
  );

  // NEW APPROACH: Identify background timeline layers and stitch them
  // Then use processLayers() once with the stitched background
  const stitchedLayers: Array<{
    media: string[];
    placement?: string;
    chromaKey?: boolean;
    chromaKeyColor?: string;
    similarity?: number;
    blend?: number;
    main?: boolean;
  }> = [];

  for (let layerIdx = 0; layerIdx < options.layers.length; layerIdx++) {
    const layer = options.layers[layerIdx];

    if ("isTimeline" in layer && layer.isTimeline) {
      // This is a timeline layer - need to stitch it
      console.log(
        `[Timeline] Stitching timeline layer ${layerIdx} with ${layer.timeline.length} segments`
      );

      // Build background segments
      const segments: BackgroundSegment[] = [];
      for (const item of layer.timeline) {
        const mediaUrl = item.media[0];
        const cached = timelineMediaCache.get(mediaUrl);
        if (!cached) {
          throw new Error(`Media not in cache: ${mediaUrl}`);
        }

        segments.push({
          mediaPath: cached.path,
          duration: item.duration || 0,
          isVideo: cached.isVideo,
        });
      }

      // Stitch this timeline layer into a single video
      const stitchedPath = join(
        tmpdir(),
        `${nanoid()}_stitched_layer_${layerIdx}.mp4`
      );
      tempFiles.push(stitchedPath);

      await stitchBackgrounds(
        segments,
        outputWidth,
        outputHeight,
        stitchedPath,
        tempFiles
      );

      console.log(
        `[Timeline] Layer ${layerIdx} stitched successfully: ${stitchedPath}`
      );

      // Use the first item's properties (placement, chromaKey, etc.)
      // since they should be consistent across the timeline
      const firstItem = layer.timeline[0];
      stitchedLayers.push({
        media: [stitchedPath],
        placement: firstItem.placement || "full",
        chromaKey: firstItem.chromaKey,
        chromaKeyColor: firstItem.chromaKeyColor,
        similarity: firstItem.similarity,
        blend: firstItem.blend,
      });
    } else {
      // Regular layer - use the already downloaded path
      if (layerIdx === mainLayerIndex) {
        stitchedLayers.push({
          ...layer,
          media: [mainLayerPath],
        });
      } else {
        stitchedLayers.push(layer);
      }
    }
  }

  // Now process all layers together in a single pass!
  console.log(
    "[Timeline] Processing all layers in single pass (no segmentation)"
  );
  return await processLayers(
    {
      ...options,
      layers: stitchedLayers,
      outputWidth,
      outputHeight,
      outputDuration: mainLayerDuration,
      mainLayer: mainLayerIndex,
    },
    tempFiles,
    outputPath
  );
}
