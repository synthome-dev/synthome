import ffmpeg from "fluent-ffmpeg";
import { unlink } from "fs/promises";
import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";
import type { LayerMediaOptions } from "../core/types";
import { isVideoFile, streamToDisk } from "../core/utils";
import { calculateLayerDimensions, ensureEven } from "../dimensions/calculator";
import { getPlacementConfig } from "../dimensions/placement";
import { probeDimensions } from "../dimensions/probe";
import { processTimelineLayers } from "../layering/timeline-layers";

/**
 * Layer multiple media files with placement and effects
 * Supports both regular layers and timeline layers
 * Returns the path to the output file (caller must handle cleanup)
 */
export async function layerMedia(options: LayerMediaOptions): Promise<string> {
  const tempFiles: string[] = [];
  const outputPath = join(tmpdir(), `${nanoid()}.mp4`);

  try {
    console.log("[LayerMedia] Starting with options:", {
      layerCount: options.layers.length,
      outputDuration: options.outputDuration,
      outputWidth: options.outputWidth,
      outputHeight: options.outputHeight,
    });

    // Check if any layer is a timeline
    const hasTimeline = options.layers.some(
      (layer) => "isTimeline" in layer && layer.isTimeline,
    );

    if (hasTimeline) {
      console.log(
        "[LayerMedia] Timeline layers detected - using timeline processing",
      );
      return await processTimelineLayers(options, tempFiles, outputPath);
    }

    // Regular (non-timeline) processing
    console.log("[LayerMedia] Processing regular layering");

    // Download all media files
    const layerPaths: string[][] = [];
    for (let i = 0; i < options.layers.length; i++) {
      const layer = options.layers[i];
      const paths: string[] = [];

      if ("isTimeline" in layer && layer.isTimeline) {
        throw new Error("Mixed timeline and regular layers not supported yet");
      }

      for (const mediaUrl of layer.media) {
        console.log(`[LayerMedia] Downloading media ${i}: ${mediaUrl}`);

        // Detect file type and use appropriate extension
        const isVideo = isVideoFile(mediaUrl);
        const ext = isVideo ? "mp4" : mediaUrl.endsWith(".png") ? "png" : "jpg";
        const path = join(tmpdir(), `${nanoid()}.${ext}`);

        // Stream directly to disk - avoids loading entire file into RAM
        await streamToDisk(mediaUrl, path);
        paths.push(path);
        tempFiles.push(path);
      }

      layerPaths.push(paths);
    }

    // Get first layer (background) dimensions
    const bgDimensions = await probeDimensions(layerPaths[0][0]);
    // Ensure dimensions are even for FFmpeg libx264/yuv420p compatibility
    const bgWidth = ensureEven(options.outputWidth || bgDimensions.width);
    const bgHeight = ensureEven(options.outputHeight || bgDimensions.height);

    console.log(
      "[LayerMedia] Background dimensions:",
      `${bgWidth}x${bgHeight}`,
    );

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
        layerPaths[mainLayerIndex][0],
      );
      if (mainLayerMetadata.duration) {
        mainLayerDuration = mainLayerMetadata.duration;
        console.log(
          `[LayerMedia] Main layer (${mainLayerIndex}) duration: ${mainLayerDuration}s`,
        );
      }
    } else {
      console.log(
        `[LayerMedia] Using explicit output duration: ${mainLayerDuration}s`,
      );
    }

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
      `${currentOutput}scale=${bgWidth}:${bgHeight}:force_original_aspect_ratio=decrease,pad=${bgWidth}:${bgHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[base]`,
    );
    currentOutput = "[base]";

    // Probe all overlay dimensions first
    const overlayDimensions: Array<{ width: number; height: number }> = [];
    for (let i = 1; i < layerPaths.length; i++) {
      const dims = await probeDimensions(layerPaths[i][0]);
      overlayDimensions.push(dims);
      console.log(
        `[LayerMedia] Layer ${i} original dimensions: ${dims.width}x${dims.height}`,
      );
    }

    // Layer each overlay on top
    for (let i = 1; i < layerPaths.length; i++) {
      const layer = options.layers[i];
      if ("isTimeline" in layer && layer.isTimeline) {
        throw new Error("Mixed timeline and regular layers not supported yet");
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
        placementConfig,
      );

      console.log(`[LayerMedia] Layer ${i} calculated:`, calculated);

      // Apply chroma key if requested
      let overlayLabel = `[${overlayIndex}:v]`;
      if (layer.chromaKey) {
        const chromaKeyColor = layer.chromaKeyColor || "0x00FF00";
        const similarity = layer.similarity ?? 0.25;
        const blend = layer.blend ?? 0.05;

        filterComplex.push(
          `${overlayLabel}chromakey=${chromaKeyColor}:${similarity}:${blend}[chroma${i}]`,
        );
        overlayLabel = `[chroma${i}]`;
      }

      // Scale overlay to exact calculated dimensions
      filterComplex.push(
        `${overlayLabel}scale=${calculated.width}:${calculated.height}[scaled${i}]`,
      );

      // Overlay on current output
      filterComplex.push(
        `${currentOutput}[scaled${i}]overlay=${calculated.x}:${calculated.y}[out${i}]`,
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
          console.log("[LayerMedia] FFmpeg command:", commandLine),
        )
        .on("progress", (progress: { percent: number }) =>
          console.log("[LayerMedia] Progress:", progress.percent, "% done"),
        )
        .on("error", (err: Error) => {
          console.error("[LayerMedia] FFmpeg error:", err.message);
          console.error(
            "[LayerMedia] Filter complex used:",
            filterComplex.join("; "),
          );
          console.error("[LayerMedia] Configuration:", {
            bgWidth,
            bgHeight,
            mainLayerIndex,
            mainLayerDuration,
            layerCount: options.layers.length,
            outputPath,
          });
          reject(
            new Error(
              `FFmpeg failed during layer-media processing: ${err.message}`,
            ),
          );
        })
        .save(outputPath)
        .on("end", resolve);
    });

    // Return path to output file - caller streams it
    return outputPath;
  } finally {
    // Cleanup all temp files (but NOT outputPath - caller handles that)
    try {
      await Promise.all([
        ...tempFiles.map((file) => unlink(file).catch(() => {})),
      ]);
    } catch (e) {
      console.error("[LayerMedia] Cleanup error:", e);
    }
  }
}
