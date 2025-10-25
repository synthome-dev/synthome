import type { VideoFormat } from "@repo/providers";

export interface WatermarkPosition {
  x: `${number}%`;
  y: `${number}%`;
}

export function getWatermarkPosition(format: VideoFormat): WatermarkPosition {
  // Center watermark horizontally for all formats
  // Adjust vertical position slightly for each format
  switch (format) {
    case "16:9":
      return { x: "50%", y: "95%" };
    case "9:16":
      return { x: "50%", y: "94%" };
    case "1:1":
      return { x: "50%", y: "94%" };
    default:
      return { x: "50%", y: "95%" };
  }
}
