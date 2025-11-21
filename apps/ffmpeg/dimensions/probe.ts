/**
 * Probe video/image dimensions using ffprobe
 */

import ffmpeg from "fluent-ffmpeg";

export async function probeDimensions(
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
