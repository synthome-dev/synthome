// Unified Model API (Recommended - Type-Safe)
export {
  audioModel,
  imageModel,
  videoModel,
  type AudioModelName,
  type ImageModelName,
  type VideoModelName,
} from "./models.js";

// Model Utility Functions
export {
  getModelInfo,
  isModelAvailable,
  listModelProviders,
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
  ErrorResponse,
  ExecuteResponse,
  ExecutionStatusResponse,
  MediaResult,
} from "./types/api-types.js";

export { generateVideo } from "./compose/generate-video.js";
export type {
  GenerateVideoOptions,
  GenerateVideoProvider,
  GenerateVideoUnified,
  JobWebhookOptions,
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
  layers,
  lipSync,
  merge,
  reframe,
  removeBackground,
} from "./compose/operations.js";
export type {
  LipSyncOptions,
  MergeItem,
  MergeItemWithOptions,
  MergeMediaType,
  MergeOperation,
  ProcessedMergeItem,
  ReframeOptions,
  RemoveBackgroundOptions,
  SubtitlesOptions,
  LayerItem,
  TimelineItem,
  LayersOptions,
  PlacementPreset,
  CustomPlacement,
} from "./compose/operations.js";

export { captions } from "./compose/captions.js";
export type {
  CaptionsOptions,
  CaptionStyle,
  CaptionWord,
} from "./compose/captions.js";

export { video } from "./compose/video.js";
export type { CreateVideoOptions } from "./compose/video.js";

export type {
  Audio,
  AudioOperation,
  ExecutionPlan,
  Image,
  ImageOperation,
  JobNode,
  LayerOperation,
  MediaResult as CoreMediaResult,
  OperationType,
  Video,
  VideoNode,
  VideoOperation,
} from "./core/video.js";

export {
  getSynthomeApiKey,
  getSynthomeApiUrl,
  tryGetSynthomeApiKey,
} from "./utils/api-key.js";
