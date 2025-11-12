import type { Video } from "../core/video.js";

export interface CreateVideoOptions {
  url: string;
  duration?: number;
  aspectRatio?: string;
}

export function video(options: CreateVideoOptions): Video {
  return {
    url: options.url,
    status: "completed",
    duration: options.duration || 0,
    aspectRatio: options.aspectRatio || "16:9",
  };
}
