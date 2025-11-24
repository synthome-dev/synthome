import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

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
        ...tempFiles.map((file) => unlink(file).catch(() => {})),
        unlink(outputPath).catch(() => {}),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
