export { replicate } from "./providers/replicate.js";
export type {
  ReplicateModelId,
  ReplicateModels,
  Seedance1ProOptions,
} from "./providers/replicate.js";

export { fal } from "./providers/fal.js";
export type { FalModelId, FalModels } from "./providers/fal.js";

export { googleCloud } from "./providers/google-cloud.js";
export type {
  GoogleCloudModelId,
  GoogleCloudModels,
} from "./providers/google-cloud.js";

export { generateVideo as generateVideoAPI } from "./generators/generate-video-api.js";
export type { GenerateVideoOptions as GenerateVideoAPIOptions } from "./generators/generate-video-api.js";

export type {
  BaseGenerateOptions,
  JobStatus,
  PollingConfig,
  ProviderConfig,
  VideoJob,
  VideoModel,
  ImageModel,
  VideoProvider,
  WebhookConfig,
} from "./core/types.js";

export { compose } from "./compose/pipeline.js";
export type {
  Pipeline,
  PipelineProgress,
  PipelineExecution,
  ExecuteOptions,
} from "./compose/pipeline.js";

export { generateVideo } from "./compose/generate-video.js";
export type {
  GenerateVideoOptions,
  GenerateVideoUnified,
  GenerateVideoProvider,
} from "./compose/generate-video.js";

export { generateImage } from "./compose/generate-image.js";
export type {
  GenerateImageOptions,
  GenerateImageProvider,
} from "./compose/generate-image.js";

export { merge, reframe, lipSync, addSubtitles } from "./compose/operations.js";
export type {
  MergeOptions,
  ReframeOptions,
  LipSyncOptions,
  SubtitlesOptions,
} from "./compose/operations.js";

export { video } from "./compose/video.js";
export type { CreateVideoOptions } from "./compose/video.js";

export type {
  Video,
  Image,
  VideoNode,
  VideoOperation,
  ImageOperation,
  ExecutionPlan,
  JobNode,
  OperationType,
} from "./core/video.js";
