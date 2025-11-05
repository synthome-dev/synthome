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
