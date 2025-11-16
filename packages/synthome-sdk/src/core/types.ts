export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface VideoJob {
  id: string;
  status: JobStatus;
  url?: string;
  error?: string;
  progress?: number;
  metadata?: Record<string, unknown>;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
}

export interface PollingConfig {
  onProgress?: (job: VideoJob) => void;
}

export interface BaseGenerateOptions {
  webhook?: WebhookConfig;
  onProgress?: (job: VideoJob) => void;
}

export interface ProviderConfig {
  apiKey?: string;
}

export type VideoProvider =
  | "replicate"
  | "fal"
  | "google-cloud"
  | "hume"
  | "elevenlabs";
export type MediaProvider = VideoProvider;

export interface VideoModel<TOptions extends ProviderConfig = ProviderConfig> {
  provider: VideoProvider;
  modelId: string;
  options: TOptions;
}

export interface ImageModel<TOptions extends ProviderConfig = ProviderConfig> {
  provider: MediaProvider;
  modelId: string;
  options: TOptions;
}

export interface AudioModel<TOptions extends ProviderConfig = ProviderConfig> {
  provider: MediaProvider;
  modelId: string;
  options: TOptions;
}
