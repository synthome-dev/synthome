/**
 * Process regular layers (non-timeline layering)
 */

import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";
import type { LayerMediaOptions } from "../core/types.js";
import { isVideoFile } from "../core/utils.js";
import {
  calculateLayerDimensions,
  ensureEven,
} from "../dimensions/calculator.js";
import { getPlacementConfig } from "../dimensions/placement.js";
import { probeDimensions } from "../dimensions/probe.js";

export async function processLayers(
  options: LayerMediaOptions,
  tempFiles: string[],
  outputPath: string
): Promise<Buffer> {
  // Download all media files
  const layerPaths: string[][] = [];
  for (let i = 0; i < options.layers.length; i++) {
    const layer = options.layers[i];
    const paths: string[] = [];

    if ("isTimeline" in layer && layer.isTimeline) {
      throw new Error("Timeline layers should not reach processLayers");
    }

    for (const mediaUrl of layer.media) {
      console.log(`[LayerMedia] Processing media ${i}: ${mediaUrl}`);

      // Check if it's a local file path or a URL
      const isLocalPath =
        mediaUrl.startsWith("/") ||
        mediaUrl.startsWith("./") ||
        mediaUrl.startsWith("../");

      if (isLocalPath) {
        // It's already a local file path - use it directly
        console.log(`[LayerMedia] Using local file: ${mediaUrl}`);
        paths.push(mediaUrl);
        // Don't add to tempFiles since it's already managed
      } else {
        // It's a URL - download it
        console.log(`[LayerMedia] Downloading from URL: ${mediaUrl}`);
        const response = await fetch(mediaUrl);
        if (!response.ok) {
          throw new Error(`Failed to download media: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());

        // Detect file type and use appropriate extension
        const isVideo = isVideoFile(mediaUrl);
        const ext = isVideo ? "mp4" : mediaUrl.endsWith(".png") ? "png" : "jpg";
        const path = join(tmpdir(), `${nanoid()}.${ext}`);

        await Bun.write(path, buffer);
        paths.push(path);
        tempFiles.push(path);
      }
    }

    layerPaths.push(paths);
  }

  // Find the main layer index (for audio mapping)
  let mainLayerIndex = options.mainLayer ?? 0; // Default to first layer if not specified

  // If mainLayer not explicitly set, find layer with main: true
  if (options.mainLayer === undefined) {
    for (let i = 0; i < options.layers.length; i++) {
      const layer = options.layers[i];
      if ("main" in layer && layer.main) {
        mainLayerIndex = i;
        break;
      }
    }
  }

  console.log("[LayerMedia] Main layer index (for audio):", mainLayerIndex);

  // Probe main layer to get its duration
  let mainLayerDuration: number | undefined = options.outputDuration;

  if (!mainLayerDuration) {
    const mainLayerMetadata = await probeDimensions(
      layerPaths[mainLayerIndex][0]
    );
    if (mainLayerMetadata.duration) {
      mainLayerDuration = mainLayerMetadata.duration;
      console.log(
        `[LayerMedia] Main layer (${mainLayerIndex}) duration: ${mainLayerDuration}s`
      );
    }
  } else {
    console.log(
      `[LayerMedia] Using explicit output duration: ${mainLayerDuration}s`
    );
  }

  // Get first layer (background) dimensions
  const bgDimensions = await probeDimensions(layerPaths[0][0]);
  // Ensure dimensions are even for FFmpeg libx264/yuv420p compatibility
  const bgWidth = ensureEven(options.outputWidth || bgDimensions.width);
  const bgHeight = ensureEven(options.outputHeight || bgDimensions.height);

  console.log("[LayerMedia] Background dimensions:", `${bgWidth}x${bgHeight}`);

  // Build FFmpeg command
  let command = ffmpeg();

  // Add all inputs
  for (const paths of layerPaths) {
    command = command.input(paths[0]);
  }

  const filterComplex: string[] = [];
  let currentOutput = "[0:v]";

  // First layer is the base - scale it to output dimensions
  filterComplex.push(
    `${currentOutput}scale=${bgWidth}:${bgHeight}:force_original_aspect_ratio=decrease,pad=${bgWidth}:${bgHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[base]`
  );
  currentOutput = "[base]";

  // Probe all overlay dimensions first
  const overlayDimensions: Array<{ width: number; height: number }> = [];
  for (let i = 1; i < layerPaths.length; i++) {
    const dims = await probeDimensions(layerPaths[i][0]);
    overlayDimensions.push(dims);
    console.log(
      `[LayerMedia] Layer ${i} original dimensions: ${dims.width}x${dims.height}`
    );
  }

  // Layer each overlay on top
  for (let i = 1; i < layerPaths.length; i++) {
    const layer = options.layers[i];
    if ("isTimeline" in layer && layer.isTimeline) {
      throw new Error("Timeline layers should not reach processLayers");
    }

    const overlayIndex = i;
    const overlayDims = overlayDimensions[i - 1];

    // Get placement config
    const placement = layer.placement || "center";
    const placementConfig = getPlacementConfig(placement);

    console.log(`[LayerMedia] Layer ${i} placement:`, placement);

    // Calculate exact dimensions in TypeScript
    const calculated = calculateLayerDimensions(
      bgWidth,
      bgHeight,
      overlayDims.width,
      overlayDims.height,
      placementConfig
    );

    console.log(`[LayerMedia] Layer ${i} calculated:`, calculated);

    // Apply chroma key if requested
    let overlayLabel = `[${overlayIndex}:v]`;
    if (layer.chromaKey) {
      const chromaKeyColor = layer.chromaKeyColor || "0x00FF00";
      const similarity = layer.similarity ?? 0.25;
      const blend = layer.blend ?? 0.05;

      filterComplex.push(
        `${overlayLabel}chromakey=${chromaKeyColor}:${similarity}:${blend}[chroma${i}]`
      );
      overlayLabel = `[chroma${i}]`;
    }

    // Scale overlay to exact calculated dimensions
    filterComplex.push(
      `${overlayLabel}scale=${calculated.width}:${calculated.height}[scaled${i}]`
    );

    // Overlay on current output
    filterComplex.push(
      `${currentOutput}[scaled${i}]overlay=${calculated.x}:${calculated.y}[out${i}]`
    );
    currentOutput = `[out${i}]`;
  }

  console.log("[LayerMedia] Filter complex:", filterComplex.join("; "));

  // Execute FFmpeg command
  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", currentOutput, "-map", `${mainLayerIndex}:a?`])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt", "yuv420p"])
      .toFormat("mp4");

    // Apply duration trimming based on main layer or explicit duration
    if (mainLayerDuration) {
      command.outputOptions(["-t", mainLayerDuration.toString()]);
    }

    command
      .on("start", (commandLine: string) =>
        console.log("[LayerMedia] FFmpeg command:", commandLine)
      )
      .on("progress", (progress: { percent: number }) =>
        console.log("[LayerMedia] Progress:", progress.percent, "% done")
      )
      .on("error", reject)
      .save(outputPath)
      .on("end", resolve);
  });

  return Buffer.from(await Bun.file(outputPath).arrayBuffer());
}
