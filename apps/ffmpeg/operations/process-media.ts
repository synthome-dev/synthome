import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

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
        unlink(inputPath).catch(() => {}),
        unlink(outputPath).catch(() => {}),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
