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
