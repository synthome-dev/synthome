import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";

export interface FFmpegOptions {
  inputFormat?: string;
  outputFormat: string;
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  fps?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  audioChannels?: number;
  audioFrequency?: number;
  startTime?: string;
  duration?: string;
  seek?: string;
  filters?: string[];
}

export async function processMedia(
  inputBuffer: Buffer,
  options: FFmpegOptions,
): Promise<Buffer> {
  // Security: Validate outputFormat to prevent path traversal
  const safeOutputFormat = options.outputFormat.replace(/[^a-zA-Z0-9]/g, "");
  if (!safeOutputFormat) {
    throw new Error("Invalid output format");
  }

  const inputPath = join(
    tmpdir(),
    `${nanoid()}.${options.inputFormat || "mp4"}`,
  );
  const outputPath = join(tmpdir(), `${nanoid()}.${safeOutputFormat}`);

  try {
    await Bun.write(inputPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg(inputPath).toFormat(options.outputFormat);

      if (options.videoCodec) command = command.videoCodec(options.videoCodec);
      if (options.audioCodec) command = command.audioCodec(options.audioCodec);
      if (options.videoBitrate)
        command = command.videoBitrate(options.videoBitrate);
      if (options.audioBitrate)
        command = command.audioBitrate(options.audioBitrate);
      if (options.fps) command = command.fps(options.fps);
      if (options.width || options.height) {
        command = command.size(
          `${options.width || "?"}x${options.height || "?"}`,
        );
      }
      if (options.aspectRatio) command = command.aspect(options.aspectRatio);
      if (options.audioChannels)
        command = command.audioChannels(options.audioChannels);
      if (options.audioFrequency)
        command = command.audioFrequency(options.audioFrequency);
      if (options.startTime) command = command.setStartTime(options.startTime);
      if (options.duration) command = command.setDuration(options.duration);
      if (options.seek) command = command.seek(options.seek);

      if (options.filters && options.filters.length > 0) {
        options.filters.forEach((filter) => {
          command = command.complexFilter(filter);
        });
      }

      command
        .on("start", (commandLine: string) =>
          console.log("Started FFmpeg with command:", commandLine),
        )
        .on("progress", (progress: { percent: number }) =>
          console.log("Processing:", progress.percent, "% done"),
        )
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return Buffer.from(await Bun.file(outputPath).arrayBuffer());
  } finally {
    // Cleanup
    try {
      await Promise.all([
        Bun.file(inputPath).delete(),
        Bun.file(outputPath).delete(),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}

// Common preset functions
export const presets = {
  compressVideo: (
    quality: "low" | "medium" | "high" = "medium",
  ): FFmpegOptions => ({
    outputFormat: "mp4",
    videoCodec: "libx264",
    audioCodec: "aac",
    videoBitrate:
      quality === "low" ? "500k" : quality === "medium" ? "1000k" : "2000k",
    audioBitrate:
      quality === "low" ? "64k" : quality === "medium" ? "128k" : "192k",
  }),

  createGif: (fps: number = 10): FFmpegOptions => ({
    outputFormat: "gif",
    fps,
    filters: ["split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"],
  }),

  extractAudio: (format: "mp3" | "aac" | "wav" = "mp3"): FFmpegOptions => ({
    outputFormat: format,
    audioCodec:
      format === "mp3" ? "libmp3lame" : format === "aac" ? "aac" : "pcm_s16le",
    audioBitrate: "192k",
  }),

  thumbnail: (
    time: string = "00:00:01",
    size: { width?: number; height?: number } = {},
  ): FFmpegOptions => ({
    outputFormat: "jpg",
    seek: time,
    duration: "1",
    ...size,
  }),
};

export interface MergeVideosOptions {
  videos: { url: string }[];
  transition?: {
    type: "fade";
    duration: number;
  };
}

export async function mergeVideos(
  options: MergeVideosOptions,
): Promise<Buffer> {
  const tempFiles: string[] = [];
  // Security: Always use temp directory with random filename, never accept custom output paths
  const outputPath = join(tmpdir(), `${nanoid()}.mp4`);

  try {
    // Download all videos to temp files
    console.log(`Downloading ${options.videos.length} videos...`);
    for (const video of options.videos) {
      const response = await fetch(video.url);
      if (!response.ok) {
        throw new Error(
          `Failed to download video from ${video.url}: ${response.statusText}`,
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const tempPath = join(tmpdir(), `${nanoid()}.mp4`);
      await Bun.write(tempPath, buffer);
      tempFiles.push(tempPath);
    }

    // Merge videos using FFmpeg concat filter
    // Handle videos with or without audio
    await new Promise<void>((resolve, reject) => {
      let command = ffmpeg();

      // Add all input files
      tempFiles.forEach((file) => {
        command = command.input(file);
      });

      // Build concat filter for video only (most AI-generated videos don't have audio)
      // Format: [0:v][1:v]concat=n=2:v=1:a=0[outv]
      const inputs = tempFiles.map((_, i) => `[${i}:v]`).join("");
      const filterComplex = `${inputs}concat=n=${tempFiles.length}:v=1:a=0[outv]`;

      command
        .complexFilter(filterComplex)
        .outputOptions(["-map", "[outv]"])
        .videoCodec("libx264")
        .toFormat("mp4")
        .on("start", (commandLine: string) =>
          console.log("Started FFmpeg merge with command:", commandLine),
        )
        .on("progress", (progress: { percent: number }) =>
          console.log("Merging:", progress.percent, "% done"),
        )
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return Buffer.from(await Bun.file(outputPath).arrayBuffer());
  } finally {
    // Cleanup all temp files
    try {
      await Promise.all([
        ...tempFiles.map((file) => Bun.file(file).delete()),
        Bun.file(outputPath).delete(),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}

export interface VideoMetadata {
  duration: number; // Duration in seconds
  width: number;
  height: number;
  fps: number;
}

/**
 * Get video metadata (duration, dimensions, fps)
 */
export async function getVideoMetadata(
  videoPath: string,
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video",
      );

      if (!videoStream) {
        reject(new Error("No video stream found"));
        return;
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: eval(videoStream.r_frame_rate || "30/1"),
      });
    });
  });
}

/**
 * Detect if a file path is a video or image based on extension
 */
function isVideoFile(filePath: string): boolean {
  const videoExtensions = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".flv",
    ".wmv",
  ];
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));
  return videoExtensions.includes(ext);
}

/**
 * Get metadata for a media file (video or image)
 */
async function getMediaMetadata(
  filePath: string,
): Promise<VideoMetadata & { isVideo: boolean }> {
  const isVideo = isVideoFile(filePath);

  if (!isVideo) {
    // For images, we just need dimensions (duration is not applicable)
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const stream = metadata.streams[0];
        if (!stream) {
          reject(new Error("No stream found in image"));
          return;
        }

        resolve({
          duration: 0,
          width: stream.width || 0,
          height: stream.height || 0,
          fps: 0,
          isVideo: false,
        });
      });
    });
  }

  // For videos, get full metadata
  const metadata = await getVideoMetadata(filePath);
  return { ...metadata, isVideo: true };
}

/**
 * Loop a video to match a target duration
 * Returns path to the looped video file
 */
async function loopVideoToMatchDuration(
  videoPath: string,
  targetDuration: number,
  videoMetadata: VideoMetadata,
  tempFiles: string[],
): Promise<string> {
  const loopedPath = join(tmpdir(), `${nanoid()}_looped.mp4`);
  tempFiles.push(loopedPath);

  if (videoMetadata.duration >= targetDuration) {
    // Background is longer than target, just trim it
    console.log(
      `[LoopVideo] Trimming background from ${videoMetadata.duration}s to ${targetDuration}s`,
    );
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .inputOptions([`-t ${targetDuration}`])
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-pix_fmt", "yuv420p"])
        .toFormat("mp4")
        .on("start", (commandLine: string) =>
          console.log("Trim FFmpeg command:", commandLine),
        )
        .on("error", reject)
        .save(loopedPath)
        .on("end", resolve);
    });
    return loopedPath;
  }

  // Calculate how many loops we need
  const loopsNeeded = Math.ceil(targetDuration / videoMetadata.duration);
  console.log(
    `[LoopVideo] Looping background ${loopsNeeded} times (${videoMetadata.duration}s -> ${targetDuration}s)`,
  );

  // Create a concat file listing
  const concatListPath = join(tmpdir(), `${nanoid()}_concat.txt`);
  tempFiles.push(concatListPath);

  const concatContent = Array(loopsNeeded)
    .fill(`file '${videoPath}'`)
    .join("\n");
  await Bun.write(concatListPath, concatContent);

  // Concat the video multiple times, then trim to exact duration
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions([`-t ${targetDuration}`])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt", "yuv420p"])
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log("Loop FFmpeg command:", commandLine),
      )
      .on("error", reject)
      .save(loopedPath)
      .on("end", resolve);
  });

  return loopedPath;
}

/**
 * Placement preset configurations for overlay positioning
 * Returns FFmpeg overlay filter parameters (x, y, width, height)
 */
interface PlacementConfig {
  x: string; // X position (can use FFmpeg expressions like "(W-w)/2")
  y: string; // Y position
  width?: string; // Optional width scaling
  height?: string; // Optional height scaling
}

/**
 * Probe video/image dimensions using ffprobe
 */
async function probeDimensions(
  filePath: string,
): Promise<{ width: number; height: number; duration?: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video",
      );
      if (!videoStream || !videoStream.width || !videoStream.height) {
        reject(new Error("Could not find video stream dimensions"));
        return;
      }

      resolve({
        width: videoStream.width,
        height: videoStream.height,
        duration: metadata.format.duration,
      });
    });
  });
}

/**
 * Evaluate a dimension expression (e.g., "iw/2" -> 360)
 */
function evaluateDimensionExpression(
  expr: string,
  bgWidth: number,
  bgHeight: number,
): number {
  // Replace iw with background width, ih with background height
  let evaluated = expr
    .replace(/iw/g, bgWidth.toString())
    .replace(/ih/g, bgHeight.toString());

  // Evaluate the expression
  try {
    // Safe eval: only allow numbers and basic math operators
    if (!/^[\d\s+\-*/().]+$/.test(evaluated)) {
      throw new Error(`Unsafe expression: ${evaluated}`);
    }
    return Math.floor(eval(evaluated));
  } catch (e) {
    throw new Error(`Failed to evaluate expression "${expr}": ${e}`);
  }
}

/**
 * Evaluate a position expression (e.g., "H-h" -> 920)
 */
function evaluatePositionExpression(
  expr: string,
  bgWidth: number,
  bgHeight: number,
  overlayWidth: number,
  overlayHeight: number,
): number {
  // Replace W/H with background, w/h with overlay
  let evaluated = expr
    .replace(/W/g, bgWidth.toString())
    .replace(/H/g, bgHeight.toString())
    .replace(/w/g, overlayWidth.toString())
    .replace(/h/g, overlayHeight.toString());

  // Evaluate the expression
  try {
    // Safe eval: only allow numbers and basic math operators
    if (!/^[\d\s+\-*/().]+$/.test(evaluated)) {
      throw new Error(`Unsafe expression: ${evaluated}`);
    }
    return Math.floor(eval(evaluated));
  } catch (e) {
    throw new Error(`Failed to evaluate expression "${expr}": ${e}`);
  }
}

/**
 * Calculate final dimensions and position for an overlay
 */
function calculateLayerDimensions(
  bgWidth: number,
  bgHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  placementConfig: PlacementConfig,
): { width: number; height: number; x: number; y: number } {
  let scaledWidth: number;
  let scaledHeight: number;

  // Calculate scaled dimensions preserving aspect ratio
  if (placementConfig.width && !placementConfig.height) {
    // Width specified: calculate from expression, preserve aspect ratio
    scaledWidth = evaluateDimensionExpression(
      placementConfig.width,
      bgWidth,
      bgHeight,
    );
    // Preserve overlay aspect ratio
    scaledHeight = Math.floor(scaledWidth * (overlayHeight / overlayWidth));
  } else if (placementConfig.height && !placementConfig.width) {
    // Height specified: calculate from expression, preserve aspect ratio
    scaledHeight = evaluateDimensionExpression(
      placementConfig.height,
      bgWidth,
      bgHeight,
    );
    // Preserve overlay aspect ratio
    scaledWidth = Math.floor(scaledHeight * (overlayWidth / overlayHeight));
  } else if (placementConfig.width && placementConfig.height) {
    // Both specified: use both values
    scaledWidth = evaluateDimensionExpression(
      placementConfig.width,
      bgWidth,
      bgHeight,
    );
    scaledHeight = evaluateDimensionExpression(
      placementConfig.height,
      bgWidth,
      bgHeight,
    );
  } else {
    // No scaling specified: use original dimensions
    scaledWidth = overlayWidth;
    scaledHeight = overlayHeight;
  }

  // Calculate position
  const x = evaluatePositionExpression(
    placementConfig.x,
    bgWidth,
    bgHeight,
    scaledWidth,
    scaledHeight,
  );
  const y = evaluatePositionExpression(
    placementConfig.y,
    bgWidth,
    bgHeight,
    scaledWidth,
    scaledHeight,
  );

  console.log(`[DimensionCalc] Background: ${bgWidth}x${bgHeight}`);
  console.log(
    `[DimensionCalc] Overlay original: ${overlayWidth}x${overlayHeight}`,
  );
  console.log(`[DimensionCalc] Overlay scaled: ${scaledWidth}x${scaledHeight}`);
  console.log(`[DimensionCalc] Position: (${x}, ${y})`);

  return { width: scaledWidth, height: scaledHeight, x, y };
}

/**
 * Parse Tailwind-style placement strings like "w-1/4 bottom-right"
 */
function parseTailwindPlacement(placement: string): PlacementConfig {
  const tokens = placement.toLowerCase().split(/\s+/);

  let width: string | undefined;
  let height: string | undefined;
  let position = "center"; // default position

  for (const token of tokens) {
    if (token.startsWith("w-")) {
      // Width token: w-1/2, w-1/3, w-1/4, etc.
      const fraction = token.substring(2); // Remove "w-"
      width = `iw*${fraction}`;
    } else if (token.startsWith("h-")) {
      // Height token: h-1/2, h-1/3, h-1/4, etc.
      const fraction = token.substring(2); // Remove "h-"
      height = `ih*${fraction}`;
    } else {
      // Position token
      position = token;
    }
  }

  // Get position coordinates
  const positionConfig = getPositionCoordinates(position);

  return {
    width,
    height,
    x: positionConfig.x,
    y: positionConfig.y,
  };
}

/**
 * Get position coordinates for placement
 */
function getPositionCoordinates(position: string): { x: string; y: string } {
  const positions: Record<string, { x: string; y: string }> = {
    "top-left": { x: "0", y: "0" },
    top: { x: "(W-w)/2", y: "0" },
    "top-center": { x: "(W-w)/2", y: "0" },
    "top-right": { x: "W-w", y: "0" },
    left: { x: "0", y: "(H-h)/2" },
    "center-left": { x: "0", y: "(H-h)/2" },
    center: { x: "(W-w)/2", y: "(H-h)/2" },
    right: { x: "W-w", y: "(H-h)/2" },
    "center-right": { x: "W-w", y: "(H-h)/2" },
    "bottom-left": { x: "0", y: "H-h" },
    bottom: { x: "(W-w)/2", y: "H-h" },
    "bottom-center": { x: "(W-w)/2", y: "(H-h)/2" },
    "bottom-right": { x: "W-w", y: "H-h" },
  };

  return positions[position] || positions["center"];
}

/**
 * Get placement configuration from preset name or Tailwind-style string
 */
function getPlacementConfig(placement: string): PlacementConfig {
  // Handle simple presets
  const presets: Record<string, PlacementConfig> = {
    full: { x: "0", y: "0", width: "iw", height: "ih" },
    center: { x: "(W-w)/2", y: "(H-h)/2" },
    pip: { x: "W-w-20", y: "H-h-20", width: "iw/4", height: "ih/4" },
    "picture-in-picture": {
      x: "W-w-20",
      y: "H-h-20",
      width: "iw/4",
      height: "ih/4",
    },
  };

  if (presets[placement]) {
    return presets[placement];
  }

  // Parse Tailwind-style string
  return parseTailwindPlacement(placement);
}

/**
 * Process timeline layers - when backgrounds/overlays change over time
 */
async function processTimelineLayers(
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

    return await processSimpleLayers(
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

/**
 * Process a single timeline segment
 */
async function processSegment(
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
  options: LayerMediaOptions,
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

/**
 * Concatenate multiple video segments into one
 */
async function concatenateSegments(
  segmentPaths: string[],
  outputPath: string,
): Promise<void> {
  let command = ffmpeg();

  // Add all segment inputs
  for (const segmentPath of segmentPaths) {
    command = command.input(segmentPath);
  }

  // Build concat filter - inputs must be interleaved [0:v][0:a][1:v][1:a]...
  const interleavedInputs = segmentPaths
    .map((_, i) => `[${i}:v][${i}:a]`)
    .join("");
  const filterComplex = `${interleavedInputs}concat=n=${segmentPaths.length}:v=1:a=1[outv][outa]`;

  await new Promise<void>((resolve, reject) => {
    command
      .complexFilter(filterComplex)
      .outputOptions(["-map", "[outv]", "-map", "[outa]"])
      .videoCodec("libx264")
      .audioCodec("aac")
      .toFormat("mp4")
      .on("start", (commandLine: string) =>
        console.log("[Concat] FFmpeg command:", commandLine),
      )
      .on("error", reject)
      .save(outputPath)
      .on("end", resolve);
  });
}

/**
 * Process simple layers (regular layering without timeline)
 */
async function processSimpleLayers(
  options: LayerMediaOptions,
  tempFiles: string[],
  outputPath: string,
): Promise<Buffer> {
  // Download all media files
  const layerPaths: string[][] = [];
  for (let i = 0; i < options.layers.length; i++) {
    const layer = options.layers[i];
    const paths: string[] = [];

    if ("isTimeline" in layer && layer.isTimeline) {
      throw new Error("Timeline layers should not reach processSimpleLayers");
    }

    for (const mediaUrl of layer.media) {
      console.log(`[LayerMedia] Downloading media ${i}: ${mediaUrl}`);
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

    layerPaths.push(paths);
  }

  // Get first layer (background) dimensions
  const bgDimensions = await probeDimensions(layerPaths[0][0]);
  const bgWidth = options.outputWidth || bgDimensions.width;
  const bgHeight = options.outputHeight || bgDimensions.height;

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
      throw new Error("Timeline layers should not reach processSimpleLayers");
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
      .outputOptions(["-map", currentOutput, "-map", "0:a?"])
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions(["-pix_fmt", "yuv420p"])
      .toFormat("mp4");

    if (options.outputDuration) {
      command.outputOptions(["-t", options.outputDuration.toString()]);
    }

    command
      .on("start", (commandLine: string) =>
        console.log("[LayerMedia] FFmpeg command:", commandLine),
      )
      .on("progress", (progress: { percent: number }) =>
        console.log("[LayerMedia] Progress:", progress.percent, "% done"),
      )
      .on("error", reject)
      .save(outputPath)
      .on("end", resolve);
  });

  return Buffer.from(await Bun.file(outputPath).arrayBuffer());
}

export interface LayerMediaOptions {
  layers: Array<
    | {
        media: string[];
        placement?: string;
        chromaKey?: boolean;
        chromaKeyColor?: string;
        similarity?: number;
        blend?: number;
        isTimeline?: false;
        main?: boolean;
      }
    | {
        isTimeline: true;
        timeline: Array<{
          media: string[];
          placement?: string;
          chromaKey?: boolean;
          chromaKeyColor?: string;
          similarity?: number;
          blend?: number;
          duration?: number;
        }>;
        totalDuration?: number;
        needsAutoDuration?: boolean;
        explicitDuration?: number;
      }
  >;
  outputDuration?: number;
  outputWidth?: number;
  outputHeight?: number;
  mainLayer?: number;
}

/**
 * Layer multiple media files with placement and effects
 * Supports both regular layers and timeline layers
 */
export async function layerMedia(options: LayerMediaOptions): Promise<Buffer> {
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

      layerPaths.push(paths);
    }

    // Get first layer (background) dimensions
    const bgDimensions = await probeDimensions(layerPaths[0][0]);
    const bgWidth = options.outputWidth || bgDimensions.width;
    const bgHeight = options.outputHeight || bgDimensions.height;

    console.log(
      "[LayerMedia] Background dimensions:",
      `${bgWidth}x${bgHeight}`,
    );

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
        .outputOptions(["-map", currentOutput, "-map", "0:a?"])
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-pix_fmt", "yuv420p"])
        .toFormat("mp4");

      if (options.outputDuration) {
        command.outputOptions(["-t", options.outputDuration.toString()]);
      }

      command
        .on("start", (commandLine: string) =>
          console.log("[LayerMedia] FFmpeg command:", commandLine),
        )
        .on("progress", (progress: { percent: number }) =>
          console.log("[LayerMedia] Progress:", progress.percent, "% done"),
        )
        .on("error", reject)
        .save(outputPath)
        .on("end", resolve);
    });

    return Buffer.from(await Bun.file(outputPath).arrayBuffer());
  } finally {
    // Cleanup all temp files
    try {
      await Promise.all([
        ...tempFiles.map((file) => Bun.file(file).delete()),
        Bun.file(outputPath).delete(),
      ]);
    } catch (e) {
      console.error("[LayerMedia] Cleanup error:", e);
    }
  }
}

export interface ReplaceGreenScreenOptions {
  videoUrl: string;
  backgroundUrls: string[]; // Can be images or videos (videos will be looped to match main video duration)
  chromaKeyColor?: string; // Default: "0x00FF00" (green)
  similarity?: number; // Default: 0.25 (range: 0.0-1.0, balanced green removal)
  blend?: number; // Default: 0.05 (range: 0.0-1.0, minimal edge blending)
}

/**
 * Replace green screen in video with background image(s) or video(s)
 * For multiple backgrounds: distributes them evenly across video duration
 * For video backgrounds: automatically loops them to match the segment duration
 */
export async function replaceGreenScreen(
  options: ReplaceGreenScreenOptions,
): Promise<Buffer> {
  const tempFiles: string[] = [];
  const outputPath = join(tmpdir(), `${nanoid()}.mp4`);

  const chromaKeyColor = options.chromaKeyColor || "0x00FF00";
  const similarity = options.similarity ?? 0.25;
  const blend = options.blend ?? 0.05;

  try {
    // Download video
    console.log(
      `[ReplaceGreenScreen] Downloading video from ${options.videoUrl}`,
    );
    const videoResponse = await fetch(options.videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const videoPath = join(tmpdir(), `${nanoid()}.mp4`);
    await Bun.write(videoPath, videoBuffer);
    tempFiles.push(videoPath);

    // Get video metadata
    const metadata = await getVideoMetadata(videoPath);
    console.log(
      `[ReplaceGreenScreen] Video metadata:`,
      `${metadata.width}x${metadata.height}, ${metadata.duration}s, ${metadata.fps}fps`,
    );

    // Download all backgrounds
    console.log(
      `[ReplaceGreenScreen] Downloading ${options.backgroundUrls.length} backgrounds`,
    );
    const backgroundPaths: string[] = [];
    for (const bgUrl of options.backgroundUrls) {
      const bgResponse = await fetch(bgUrl);
      if (!bgResponse.ok) {
        throw new Error(
          `Failed to download background: ${bgResponse.statusText}`,
        );
      }
      const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());

      // Detect if it's a video or image and use appropriate extension
      const isVideo = isVideoFile(bgUrl);
      const ext = isVideo ? "mp4" : "jpg";
      const bgPath = join(tmpdir(), `${nanoid()}.${ext}`);

      await Bun.write(bgPath, bgBuffer);
      backgroundPaths.push(bgPath);
      tempFiles.push(bgPath);
    }

    if (options.backgroundUrls.length === 1) {
      // Single background - simple overlay
      console.log(`[ReplaceGreenScreen] Processing with single background`);

      // Get background metadata
      const bgMetadata = await getMediaMetadata(backgroundPaths[0]);
      console.log(
        `[ReplaceGreenScreen] Background type: ${bgMetadata.isVideo ? "video" : "image"}`,
      );

      let finalBackgroundPath = backgroundPaths[0];

      // If background is a video, loop it to match main video duration
      if (bgMetadata.isVideo) {
        console.log(
          `[ReplaceGreenScreen] Background video duration: ${bgMetadata.duration}s, main video: ${metadata.duration}s`,
        );
        finalBackgroundPath = await loopVideoToMatchDuration(
          backgroundPaths[0],
          metadata.duration,
          bgMetadata,
          tempFiles,
        );
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoPath)
          .input(finalBackgroundPath)
          .complexFilter([
            // Scale background to video dimensions and crop to fill
            `[1:v]scale=${metadata.width}:${metadata.height}:force_original_aspect_ratio=increase,crop=${metadata.width}:${metadata.height}[bg]`,
            // Apply chromakey to video
            `[0:v]chromakey=${chromaKeyColor}:${similarity}:${blend}[fg]`,
            // Overlay transparent video on background
            `[bg][fg]overlay=0:0[out]`,
          ])
          .outputOptions(["-map", "[out]", "-map", "0:a?"])
          .videoCodec("libx264")
          .audioCodec("aac")
          .outputOptions(["-pix_fmt", "yuv420p"]) // Ensure compatibility
          .toFormat("mp4")
          .on("start", (commandLine: string) =>
            console.log("Started FFmpeg with command:", commandLine),
          )
          .on("progress", (progress: { percent: number }) =>
            console.log("Processing:", progress.percent, "% done"),
          )
          .on("end", resolve)
          .on("error", reject)
          .save(outputPath);
      });
    } else {
      // Multiple backgrounds - split video into segments
      console.log(
        `[ReplaceGreenScreen] Processing with ${options.backgroundUrls.length} backgrounds`,
      );
      const segmentDuration = metadata.duration / options.backgroundUrls.length;
      console.log(
        `[ReplaceGreenScreen] Each segment duration: ${segmentDuration}s`,
      );

      const segmentPaths: string[] = [];

      // Process each segment
      for (let i = 0; i < options.backgroundUrls.length; i++) {
        const segmentPath = join(tmpdir(), `${nanoid()}_segment_${i}.mp4`);
        segmentPaths.push(segmentPath);
        tempFiles.push(segmentPath);

        const startTime = i * segmentDuration;
        const duration = segmentDuration;

        console.log(
          `[ReplaceGreenScreen] Processing segment ${i + 1}/${options.backgroundUrls.length}: ${startTime}s - ${startTime + duration}s`,
        );

        // Get background metadata
        const bgMetadata = await getMediaMetadata(backgroundPaths[i]);
        console.log(
          `[ReplaceGreenScreen] Segment ${i + 1} background type: ${bgMetadata.isVideo ? "video" : "image"}`,
        );

        let finalBackgroundPath = backgroundPaths[i];

        // If background is a video, loop it to match segment duration
        if (bgMetadata.isVideo) {
          console.log(
            `[ReplaceGreenScreen] Segment ${i + 1} background video duration: ${bgMetadata.duration}s, segment: ${duration}s`,
          );
          finalBackgroundPath = await loopVideoToMatchDuration(
            backgroundPaths[i],
            duration,
            bgMetadata,
            tempFiles,
          );
        }

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(videoPath)
            .inputOptions([`-ss ${startTime}`, `-t ${duration}`])
            .input(finalBackgroundPath)
            .complexFilter([
              // Scale background to video dimensions and crop to fill
              `[1:v]scale=${metadata.width}:${metadata.height}:force_original_aspect_ratio=increase,crop=${metadata.width}:${metadata.height}[bg]`,
              // Apply chromakey to video segment
              `[0:v]chromakey=${chromaKeyColor}:${similarity}:${blend}[fg]`,
              // Overlay transparent video on background
              `[bg][fg]overlay=0:0[out]`,
            ])
            .outputOptions(["-map", "[out]", "-map", "0:a?"])
            .videoCodec("libx264")
            .audioCodec("aac")
            .outputOptions(["-pix_fmt", "yuv420p"])
            .toFormat("mp4")
            .on("start", (commandLine: string) =>
              console.log(`Segment ${i + 1} FFmpeg command:`, commandLine),
            )
            .on("error", reject)
            .save(segmentPath)
            .on("end", resolve);
        });
      }

      // Concatenate all segments
      console.log(
        `[ReplaceGreenScreen] Concatenating ${segmentPaths.length} segments`,
      );
      await new Promise<void>((resolve, reject) => {
        let command = ffmpeg();

        segmentPaths.forEach((path) => {
          command = command.input(path);
        });

        const inputs = segmentPaths.map((_, i) => `[${i}:v]`).join("");
        const audioInputs = segmentPaths.map((_, i) => `[${i}:a]`).join("");
        const filterComplex = `${inputs}concat=n=${segmentPaths.length}:v=1:a=1[outv][outa]`;

        command
          .complexFilter(filterComplex)
          .outputOptions(["-map", "[outv]", "-map", "[outa]"])
          .videoCodec("libx264")
          .audioCodec("aac")
          .toFormat("mp4")
          .on("start", (commandLine: string) =>
            console.log("Concatenation FFmpeg command:", commandLine),
          )
          .on("progress", (progress: { percent: number }) =>
            console.log("Concatenating:", progress.percent, "% done"),
          )
          .on("end", resolve)
          .on("error", reject)
          .save(outputPath);
      });
    }

    return Buffer.from(await Bun.file(outputPath).arrayBuffer());
  } finally {
    // Cleanup all temp files
    try {
      await Promise.all([
        ...tempFiles.map((file) => Bun.file(file).delete()),
        Bun.file(outputPath).delete(),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
