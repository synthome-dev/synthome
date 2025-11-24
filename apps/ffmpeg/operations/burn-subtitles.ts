import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

export interface BurnSubtitlesOptions {
  videoUrl: string;
  subtitleContent: string; // ASS/SRT file content
  subtitleFormat: "ass" | "srt";
}

export async function burnSubtitles(
  options: BurnSubtitlesOptions,
): Promise<Buffer> {
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

    // Download video
    console.log(`[BurnSubtitles] Downloading video from ${options.videoUrl}`);
    const videoResponse = await fetch(options.videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    const videoPath = join(tmpdir(), `${nanoid()}.mp4`);
    await Bun.write(videoPath, videoBuffer);
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

    return Buffer.from(await Bun.file(outputPath).arrayBuffer());
  } finally {
    // Cleanup
    try {
      await Promise.all([
        ...tempFiles.map((f) => unlink(f).catch(() => {})),
        unlink(outputPath).catch(() => {}),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
