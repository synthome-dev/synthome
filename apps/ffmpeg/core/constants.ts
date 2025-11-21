/**
 * FFmpeg preset configurations and default values
 */

import type { FFmpegOptions } from "./types.js";

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
