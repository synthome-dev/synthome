import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";
import { streamToDisk } from "../core/utils";

export interface BurnSubtitlesOptions {
  videoUrl: string;
  subtitleContent: string; // ASS/SRT file content
  subtitleFormat: "ass" | "srt";
}

/**
 * Burn subtitles into video
 * Returns the path to the output file (caller must handle cleanup)
 */
export async function burnSubtitles(
  options: BurnSubtitlesOptions,
): Promise<string> {
  const outputPath = join(tmpdir(), `${nanoid()}.mp4`);
  const subtitlePath = join(tmpdir(), `${nanoid()}.${options.subtitleFormat}`);
  const tempFiles: string[] = [subtitlePath];

  try {
    // Write subtitle file
    await Bun.write(subtitlePath, options.subtitleContent);
    console.log(
      `[BurnSubtitles] Wrote subtitle file: ${subtitlePath} (${options.subtitleContent.length} chars)`,
    );
    console.log(
      `[BurnSubtitles] First 300 chars of subtitle:`,
      options.subtitleContent.substring(0, 300),
    );

    // Download video - stream directly to disk to avoid RAM usage
    console.log(`[BurnSubtitles] Downloading video from ${options.videoUrl}`);
    const videoPath = join(tmpdir(), `${nanoid()}.mp4`);
    await streamToDisk(options.videoUrl, videoPath);
    tempFiles.push(videoPath);

    console.log(`[BurnSubtitles] Burning subtitles...`);
    console.log(`[BurnSubtitles] Video path: ${videoPath}`);
    console.log(`[BurnSubtitles] Subtitle path: ${subtitlePath}`);
    console.log(`[BurnSubtitles] Output path: ${outputPath}`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          // Burn subtitles using the subtitle file
          // For ASS, we use the ass filter. For SRT, strictly subtitles filter
          options.subtitleFormat === "ass"
            ? `-vf ass=${subtitlePath}`
            : `-vf subtitles=${subtitlePath}`,
        ])
        .videoCodec("libx264")
        .audioCodec("copy") // Try to copy audio stream
        .toFormat("mp4")
        .on("start", (cmd) =>
          console.log("[BurnSubtitles] FFmpeg command:", cmd),
        )
        .on("progress", (progress) =>
          console.log(`[BurnSubtitles] Progress:`, progress),
        )
        .on("error", (err) => {
          console.error("[BurnSubtitles] FFmpeg error:", err);
          reject(err);
        })
        .on("end", () => {
          console.log("[BurnSubtitles] FFmpeg completed successfully");
          resolve();
        })
        .save(outputPath);
    });

    // Return path to output file - caller streams it
    return outputPath;
  } finally {
    // Cleanup temp files (but NOT outputPath - caller handles that)
    try {
      await Promise.all([...tempFiles.map((f) => unlink(f).catch(() => {}))]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
