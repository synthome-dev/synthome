export const VideoFormat = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:5": "4:5",
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
  "bytedance/seedance-1-lite": "bytedance/seedance-1-lite",
  "bytedance/seedance-1-pro": "bytedance/seedance-1-pro",
  "veo-3.1-fast-generate-preview": "veo-3.1-fast-generate-preview",
} as const;

export type VideoModel = (typeof VideoModel)[keyof typeof VideoModel];

export * from "./services/base-provider.js";
export * from "./services/replicate-service.js";
export * from "./services/fal-service.js";
export * from "./services/google-cloud-service.js";
export * from "./services/video-provider-factory.js";
