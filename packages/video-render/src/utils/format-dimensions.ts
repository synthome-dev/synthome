import type { VideoFormat } from "@repo/providers";

export interface VideoDimensions {
  width: number;
  height: number;
}

export function getVideoDimensions(format: VideoFormat): VideoDimensions {
  switch (format) {
    case "16:9":
      return { width: 1920, height: 1080 };
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "4:5":
      return { width: 1080, height: 1350 };
    default:
      console.warn(`Unknown video format: ${format}, defaulting to 16:9`);
      return { width: 1920, height: 1080 };
  }
}
