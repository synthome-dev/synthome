// Unified Model API (Recommended - Type-Safe)
export {
  imageModel,
  videoModel,
  audioModel,
  type ImageModelName,
  type VideoModelName,
  type AudioModelName,
} from "./models.js";

// Model Utility Functions
export {
  getModelInfo,
  listModelProviders,
  isModelAvailable,
  type UnifiedModelMapping,
} from "./model.js";

export { generateVideo as generateVideoAPI } from "./generators/generate-video-api.js";
export type { GenerateVideoOptions as GenerateVideoAPIOptions } from "./generators/generate-video-api.js";

export type {
  AudioModel,
  BaseGenerateOptions,
  ImageModel,
  JobStatus,
  PollingConfig,
  ProviderConfig,
  VideoJob,
  VideoModel,
  VideoProvider,
  WebhookConfig,
} from "./core/types.js";

export { compose, getExecutionStatus } from "./compose/pipeline.js";
export type {
  ExecuteOptions,
  Pipeline,
  PipelineExecution,
  PipelineProgress,
} from "./compose/pipeline.js";

export { executeFromPlan } from "./compose/execute-from-plan.js";

export type {
  ExecuteResponse,
  ExecutionStatusResponse,
  ErrorResponse,
  MediaResult,
} from "./types/api-types.js";

export { generateVideo } from "./compose/generate-video.js";
export type {
  GenerateVideoOptions,
  GenerateVideoProvider,
  GenerateVideoUnified,
} from "./compose/generate-video.js";

export { generateImage } from "./compose/generate-image.js";
export type {
  GenerateImageOptions,
  GenerateImageProvider,
  GenerateImageUnified,
} from "./compose/generate-image.js";

export { generateAudio } from "./compose/generate-audio.js";
export type {
  GenerateAudioOptions,
  GenerateAudioProvider,
} from "./compose/generate-audio.js";

export { removeBackgroundWithModel } from "./compose/remove-background.js";
export type {
  RemoveBackgroundWithModelOptions,
  RemoveBackgroundWithModelUnified,
} from "./compose/remove-background.js";

export {
  addSubtitles,
  lipSync,
  merge,
  reframe,
  removeBackground,
  replaceGreenScreen,
} from "./compose/operations.js";
export type {
  LipSyncOptions,
  MergeOptions,
  ReframeOptions,
  RemoveBackgroundOptions,
  ReplaceGreenScreenOptions,
  SubtitlesOptions,
} from "./compose/operations.js";

export { video } from "./compose/video.js";
export type { CreateVideoOptions } from "./compose/video.js";

export type {
  Audio,
  AudioOperation,
  ExecutionPlan,
  Image,
  ImageOperation,
  JobNode,
  MediaResult as MediaOutput,
  OperationType,
  Video,
  VideoNode,
  VideoOperation,
} from "./core/video.js";

export {
  getSynthomeApiKey,
  tryGetSynthomeApiKey,
  getSynthomeApiUrl,
} from "./utils/api-key.js";
