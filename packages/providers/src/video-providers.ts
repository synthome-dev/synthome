export const VideoFormat = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
} as const;

export type VideoFormat = (typeof VideoFormat)[keyof typeof VideoFormat];

export const VideoProvider = {
  Replicate: "replicate",
  Fal: "fal",
  Vertex: "vertex",
} as const;

export type VideoProvider = (typeof VideoProvider)[keyof typeof VideoProvider];

export const VideoModel = {
  "luma/ray-flash-2-540p": "luma/ray-flash-2-540p",
  "luma/ray-flash-2-720p": "luma/ray-flash-2-720p",
  "minimax/video-01": "minimax/video-01",
  "kwaivgi/kling-v2.1": "kwaivgi/kling-v2.1",
  "kwaivgi/kling-v2.1-master": "kwaivgi/kling-v2.1-master",
  "veo-3.0-fast": "veo-3.0-fast",
  "veo-3.0": "veo-3.0",
  "veo-2.0": "veo-2.0",
} as const;

export type VideoModel = (typeof VideoModel)[keyof typeof VideoModel];
