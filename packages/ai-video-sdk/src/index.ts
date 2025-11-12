export { replicate } from "./providers/replicate.js";
export type {
  ReplicateModelId,
  ReplicateModels,
  Seedance1ProOptions
} from "./providers/replicate.js";

export { fal } from "./providers/fal.js";
export type {
  Fabric1FastOptions,
  FalModelId,
  FalModels
} from "./providers/fal.js";

export { googleCloud } from "./providers/google-cloud.js";
export type {
  GoogleCloudModelId,
  GoogleCloudModels
} from "./providers/google-cloud.js";

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
  WebhookConfig
} from "./core/types.js";

export { compose } from "./compose/pipeline.js";
export type {
  ExecuteOptions,
  Pipeline,
  PipelineExecution,
  PipelineProgress
} from "./compose/pipeline.js";

export { generateVideo } from "./compose/generate-video.js";
export type {
  GenerateVideoOptions,
  GenerateVideoProvider,
  GenerateVideoUnified
} from "./compose/generate-video.js";

export { generateImage } from "./compose/generate-image.js";
export type {
  GenerateImageOptions,
  GenerateImageProvider
} from "./compose/generate-image.js";

export { generateAudio } from "./compose/generate-audio.js";
export type {
  GenerateAudioOptions,
  GenerateAudioProvider
} from "./compose/generate-audio.js";

export { removeBackgroundWithModel } from "./compose/remove-background.js";
export type {
  RemoveBackgroundWithModelOptions,
  RemoveBackgroundWithModelUnified
} from "./compose/remove-background.js";

export {
  addSubtitles,
  lipSync,
  merge,
  reframe,
  removeBackground,
  removeImageBackground,
  replaceGreenScreen
} from "./compose/operations.js";
export type {
  LipSyncOptions,
  MergeOptions,
  ReframeOptions,
  RemoveBackgroundOptions,
  RemoveImageBackgroundOptions,
  ReplaceGreenScreenOptions,
  SubtitlesOptions
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
  OperationType,
  Video,
  VideoNode,
  VideoOperation
} from "./core/video.js";

export { getSynthomeApiKey, tryGetSynthomeApiKey } from "./utils/api-key.js";
