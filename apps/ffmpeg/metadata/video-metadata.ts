/**
 * Video metadata operations
 */

import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { tmpdir } from "os";
import { join } from "path";
import type { VideoMetadata } from "../core/types.js";
import { isVideoFile } from "../core/utils.js";

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
 * Get metadata for a media file (video or image)
 */
export async function getMediaMetadata(
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
export async function loopVideoToMatchDuration(
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
