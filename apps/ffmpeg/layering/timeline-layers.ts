import { join } from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";
import type { LayerMediaOptions } from "../core/types";
import { isVideoFile } from "../core/utils";
import { probeDimensions } from "../dimensions/probe";
import { processLayers } from "./layers";
import { concatenateSegments } from "./concatenator";

/**
 * Process timeline layers - when backgrounds/overlays change over time
 */
export async function processTimelineLayers(
  options: LayerMediaOptions,
  tempFiles: string[],
  outputPath: string,
): Promise<Buffer> {
  console.log("[Timeline] Processing timeline layers");

  // Find the main layer (the layer with main: true, or the first non-timeline video)
  let mainLayerIndex = -1;
  let mainLayerDuration = 0;

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
          `Failed to download main layer: ${response.statusText}`,
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const isVideo = isVideoFile(layer.media[0]);
      const ext = isVideo ? "mp4" : "jpg";
      const path = join(tmpdir(), `${nanoid()}.${ext}`);
      await Bun.write(path, buffer);
      tempFiles.push(path);

      const metadata = await probeDimensions(path);
      if (metadata.duration) {
        mainLayerDuration = metadata.duration;
        console.log(
          `[Timeline] Main layer (${i}) duration: ${mainLayerDuration}s`,
        );
      }

      if (layer.main) {
        break; // Found the explicitly marked main layer
      }
    }
  }

  if (mainLayerIndex === -1) {
    throw new Error(
      "No main layer found - at least one regular (non-timeline) layer required",
    );
  }

  // Auto-calculate durations for timeline items that don't have explicit durations
  for (const layer of options.layers) {
    if ("isTimeline" in layer && layer.isTimeline) {
      // Check if this timeline needs auto-duration
      const itemsWithoutDuration = layer.timeline.filter(
        (item) => !item.duration,
      );

      if (itemsWithoutDuration.length > 0) {
        console.log(
          `[Timeline] Auto-calculating durations for ${itemsWithoutDuration.length} items`,
        );

        // Calculate total duration of items that DO have explicit durations
        const explicitDuration = layer.timeline.reduce(
          (sum, item) => sum + (item.duration || 0),
          0,
        );

        // Remaining duration to split among items without duration
        const remainingDuration = mainLayerDuration - explicitDuration;

        if (remainingDuration <= 0) {
          throw new Error(
            `Timeline items with explicit durations (${explicitDuration}s) exceed main layer duration (${mainLayerDuration}s)`,
          );
        }

        // Split remaining duration evenly
        const autoDuration = remainingDuration / itemsWithoutDuration.length;

        console.log(
          `[Timeline] Auto-duration: ${autoDuration}s per item (${remainingDuration}s / ${itemsWithoutDuration.length} items)`,
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
        0,
      );

      console.log(
        `[Timeline] Total timeline duration: ${totalTimelineDuration}s, Main layer: ${mainLayerDuration}s`,
      );
    }
  }

  // Calculate timeline segments based on timeline layers
  const timeSegments: Array<{
    startTime: number;
    endTime: number;
    duration: number;
  }> = [];

  // Collect all time points where changes occur
  const timePoints = new Set<number>([0, mainLayerDuration]);

  for (const layer of options.layers) {
    if ("isTimeline" in layer && layer.isTimeline) {
      let currentTime = 0;
      for (const item of layer.timeline) {
        if (item.duration) {
          currentTime += item.duration;
          timePoints.add(currentTime);
        }
      }
    }
  }

  // Sort time points and create segments
  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    timeSegments.push({
      startTime: sortedTimePoints[i],
      endTime: sortedTimePoints[i + 1],
      duration: sortedTimePoints[i + 1] - sortedTimePoints[i],
    });
  }

  console.log(
    `[Timeline] Created ${timeSegments.length} time segments:`,
    timeSegments,
  );

  // Determine maximum background dimensions across all timeline items
  let maxWidth = 0;
  let maxHeight = 0;

  console.log(
    "[Timeline] Probing all timeline backgrounds to find max dimensions...",
  );

  for (const layer of options.layers) {
    if ("isTimeline" in layer && layer.isTimeline) {
      for (const item of layer.timeline) {
        // Download and probe this timeline item
        const response = await fetch(item.media[0]);
        if (!response.ok) {
          throw new Error(
            `Failed to download timeline media: ${response.statusText}`,
          );
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const isVideo = isVideoFile(item.media[0]);
        const ext = isVideo
          ? "mp4"
          : item.media[0].endsWith(".png")
            ? "png"
            : "jpg";
        const path = join(tmpdir(), `${nanoid()}.${ext}`);
        await Bun.write(path, buffer);
        tempFiles.push(path);

        const dims = await probeDimensions(path);
        console.log(
          `[Timeline] Background dimensions: ${dims.width}x${dims.height}`,
        );

        if (dims.width > maxWidth) maxWidth = dims.width;
        if (dims.height > maxHeight) maxHeight = dims.height;
      }
    }
  }

  // If no explicit output size, use the maximum found
  const outputWidth = options.outputWidth || maxWidth;
  const outputHeight = options.outputHeight || maxHeight;

  console.log(
    `[Timeline] Using output resolution: ${outputWidth}x${outputHeight} (max from all backgrounds)`,
  );

  // For now, if timeline is detected but we only have simple case (one background timeline),
  // use a simplified approach
  if (timeSegments.length === 1) {
    console.log(
      "[Timeline] Single segment detected - using simplified processing",
    );
    // Just use the first item from each timeline
    const simplifiedLayers = options.layers.map((layer) => {
      if ("isTimeline" in layer && layer.isTimeline) {
        return {
          media: layer.timeline[0].media,
          placement: layer.timeline[0].placement || "full",
          chromaKey: layer.timeline[0].chromaKey,
          chromaKeyColor: layer.timeline[0].chromaKeyColor,
          similarity: layer.timeline[0].similarity,
          blend: layer.timeline[0].blend,
        };
      }
      return layer;
    });

    return await processLayers(
      { ...options, layers: simplifiedLayers, outputWidth, outputHeight },
      tempFiles,
      outputPath,
    );
  }

  // Multi-segment timeline processing
  console.log(`[Timeline] Processing ${timeSegments.length} segments`);

  const segmentPaths: string[] = [];

  for (let segIdx = 0; segIdx < timeSegments.length; segIdx++) {
    const segment = timeSegments[segIdx];
    console.log(
      `[Timeline] Processing segment ${segIdx + 1}/${timeSegments.length}: ${segment.startTime}s-${segment.endTime}s (${segment.duration}s)`,
    );

    // For this time segment, determine which timeline item is active for each layer
    const segmentLayers: Array<{
      media: string[];
      placement?: string;
      chromaKey?: boolean;
      chromaKeyColor?: string;
      similarity?: number;
      blend?: number;
      main?: boolean;
    }> = [];

    for (const layer of options.layers) {
      if ("isTimeline" in layer && layer.isTimeline) {
        // Find which timeline item is active at this segment's start time
        let currentTime = 0;
        let activeItem = layer.timeline[0]; // Default to first

        for (const item of layer.timeline) {
          const itemDuration = item.duration || 0;
          if (
            segment.startTime >= currentTime &&
            segment.startTime < currentTime + itemDuration
          ) {
            activeItem = item;
            break;
          }
          currentTime += itemDuration;
        }

        segmentLayers.push({
          media: activeItem.media,
          placement: activeItem.placement || "full",
          chromaKey: activeItem.chromaKey,
          chromaKeyColor: activeItem.chromaKeyColor,
          similarity: activeItem.similarity,
          blend: activeItem.blend,
        });
      } else {
        // Regular layer - use as-is but trim to segment duration
        segmentLayers.push(layer);
      }
    }

    // Create segment output path
    const segmentPath = join(tmpdir(), `${nanoid()}_seg${segIdx}.mp4`);
    tempFiles.push(segmentPath);

    // Process this segment
    const { processSegment } = await import("./segment-processor");
    await processSegment(
      segmentLayers,
      segment,
      segmentPath,
      tempFiles,
      options,
      mainLayerIndex,
      outputWidth,
      outputHeight,
    );

    segmentPaths.push(segmentPath);
    console.log(`[Timeline] Segment ${segIdx + 1} completed: ${segmentPath}`);
  }

  // Concatenate all segments
  console.log(`[Timeline] Concatenating ${segmentPaths.length} segments`);
  await concatenateSegments(segmentPaths, outputPath);

  return Buffer.from(await Bun.file(outputPath).arrayBuffer());
}
