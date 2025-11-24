import { nanoid } from "nanoid";
import ffmpeg from "fluent-ffmpeg";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";
import { getVideoMetadata, getMediaMetadata } from "../metadata/video-metadata";
import { isVideoFile } from "../core/utils";

export interface ReplaceGreenScreenOptions {
  videoUrl: string;
  backgroundUrls: string[]; // Can be images or videos (videos will be looped to match main video duration)
  chromaKeyColor?: string; // Default: "0x00FF00" (green)
  similarity?: number; // Default: 0.25 (range: 0.0-1.0, balanced green removal)
  blend?: number; // Default: 0.05 (range: 0.0-1.0, minimal edge blending)
}

/**
 * Loop a video to match a target duration
 * Returns path to the looped video file
 */
async function loopVideoToMatchDuration(
  videoPath: string,
  targetDuration: number,
  videoMetadata: {
    duration: number;
    width: number;
    height: number;
    fps: number;
  },
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

  // Background is shorter than target, loop it
  const loopCount = Math.ceil(targetDuration / videoMetadata.duration);
  console.log(
    `[LoopVideo] Looping background ${loopCount} times (${videoMetadata.duration}s * ${loopCount} = ${videoMetadata.duration * loopCount}s) to cover ${targetDuration}s`,
  );

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .inputOptions([`-stream_loop ${loopCount - 1}`, `-t ${targetDuration}`])
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
 * Replace green screen in video with background image(s) or video(s)
 * For multiple backgrounds: distributes them evenly across video duration
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
        ...tempFiles.map((file) => unlink(file).catch(() => {})),
        unlink(outputPath).catch(() => {}),
      ]);
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  }
}
