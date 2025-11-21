import { join } from "path";
import { tmpdir } from "os";
import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import type { LayerMediaOptions } from "../core/types";
import { isVideoFile } from "../core/utils";
import { probeDimensions } from "../dimensions/probe";
import { calculateLayerDimensions } from "../dimensions/calculator";
import { getPlacementConfig } from "../dimensions/placement";

/**
 * Process a single timeline segment
 */
export async function processSegment(
  segmentLayers: Array<{
    media: string[];
    placement?: string;
    chromaKey?: boolean;
    chromaKeyColor?: string;
    similarity?: number;
    blend?: number;
    main?: boolean;
  }>,
  segment: { startTime: number; endTime: number; duration: number },
  segmentPath: string,
  tempFiles: string[],
  _options: LayerMediaOptions,
  mainLayerIndex: number,
  outputWidth: number,
  outputHeight: number,
): Promise<void> {
  // Download all media files for this segment
  const layerPaths: string[][] = [];
  for (let i = 0; i < segmentLayers.length; i++) {
    const layer = segmentLayers[i];
    const paths: string[] = [];

    for (const mediaUrl of layer.media) {
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      const isVideo = isVideoFile(mediaUrl);
      const ext = isVideo ? "mp4" : mediaUrl.endsWith(".png") ? "png" : "jpg";
      const path = join(tmpdir(), `${nanoid()}.${ext}`);

      await Bun.write(path, buffer);
      paths.push(path);
      tempFiles.push(path);
    }

    layerPaths.push(paths);
  }

  // Use the passed output dimensions (already calculated as max across all backgrounds)
  const bgWidth = outputWidth;
  const bgHeight = outputHeight;

  console.log(`[Segment] Using normalized dimensions: ${bgWidth}x${bgHeight}`);

  // Build FFmpeg command for this segment
  let command = ffmpeg();

  // Add all inputs
  for (let i = 0; i < layerPaths.length; i++) {
    const inputPath = layerPaths[i][0];
    command = command.input(inputPath);

    // For the main layer, trim to segment time range
    if (i === mainLayerIndex) {
      command = command.inputOptions([
        `-ss ${segment.startTime}`,
        `-t ${segment.duration}`,
      ]);
    }
  }

  const filterComplex: string[] = [];
  let currentOutput = "[0:v]";

  // First layer - scale and optionally loop if it's an image
  const isFirstVideo = isVideoFile(layerPaths[0][0]);
  if (isFirstVideo) {
    // Trim video to segment duration
    filterComplex.push(
      `${currentOutput}trim=start=${segment.startTime}:duration=${segment.duration},setpts=PTS-STARTPTS,scale=${bgWidth}:${bgHeight}:force_original_aspect_ratio=decrease,pad=${bgWidth}:${bgHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1[base]`,
    );
  } else {
    // Loop image for segment duration
    filterComplex.push(
      `${currentOutput}loop=loop=-1:size=1:start=0,scale=${bgWidth}:${bgHeight}:force_original_aspect_ratio=decrease,pad=${bgWidth}:${bgHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,trim=duration=${segment.duration},setpts=PTS-STARTPTS[base]`,
    );
  }
  currentOutput = "[base]";

  // Probe all overlay dimensions
  const overlayDimensions: Array<{ width: number; height: number }> = [];
  for (let i = 1; i < layerPaths.length; i++) {
    const dims = await probeDimensions(layerPaths[i][0]);
    overlayDimensions.push(dims);
  }

  // Layer each overlay on top
  for (let i = 1; i < layerPaths.length; i++) {
    const layer = segmentLayers[i];
    const overlayIndex = i;
    const overlayDims = overlayDimensions[i - 1];

    // Get placement config
    const placement = layer.placement || "center";
    const placementConfig = getPlacementConfig(placement);

    // Calculate exact dimensions
    const calculated = calculateLayerDimensions(
      bgWidth,
      bgHeight,
      overlayDims.width,
      overlayDims.height,
      placementConfig,
    );

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

    // Scale overlay
    filterComplex.push(
      `${overlayLabel}scale=${calculated.width}:${calculated.height}[scaled${i}]`,
    );

    // Overlay on current output
    filterComplex.push(
      `${currentOutput}[scaled${i}]overlay=${calculated.x}:${calculated.y}[out${i}]`,
    );
    currentOutput = `[out${i}]`;
  }

  console.log(`[Segment] Filter complex:`, filterComplex.join("; "));

  // Execute FFmpeg for this segment
  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", currentOutput, "-map", `${mainLayerIndex}:a?`])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt", "yuv420p"])
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log(`[Segment] FFmpeg command:`, commandLine),
      )
      .on("error", reject)
      .save(segmentPath)
      .on("end", resolve);
  });
}
