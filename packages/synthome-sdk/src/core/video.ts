/**
 * Base interface for all media results (video, audio, image)
 * Contains the essential fields that all media types share
 */
export interface MediaResult {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
}

/**
 * Video result - extends MediaResult
 * Can be extended in the future with video-specific metadata
 */
export interface Video extends MediaResult {}

/**
 * Image result - extends MediaResult
 * Can be extended in the future with image-specific metadata
 */
export interface Image extends MediaResult {}

/**
 * Audio result - extends MediaResult
 * Can be extended in the future with audio-specific metadata
 */
export interface Audio extends MediaResult {}

export type VideoNode = Video | VideoOperation | Pipeline;

export type OperationType =
  | "generate"
  | "generateImage"
  | "generateAudio"
  | "merge"
  | "reframe"
  | "lipSync"
  | "addSubtitles"
  | "removeBackground"
  | "removeImageBackground"
  | "layer";

export interface VideoOperation {
  type: OperationType;
  params: Record<string, unknown>;
  inputs?: VideoNode[];
}

export interface ImageOperation {
  type: "generateImage" | "removeImageBackground";
  params: Record<string, unknown>;
}

export interface AudioOperation {
  type: "generateAudio";
  params: Record<string, unknown>;
}

export interface LayerOperation {
  type: "layer";
  params: {
    layers: Array<{
      media?: string | string[];
      placement?:
        | "full"
        | "top-left"
        | "top-center"
        | "top-right"
        | "center-left"
        | "center"
        | "center-right"
        | "bottom-left"
        | "bottom-center"
        | "bottom-right"
        | "top-left-quarter"
        | "top-right-quarter"
        | "bottom-left-quarter"
        | "bottom-right-quarter"
        | "picture-in-picture"
        | "sequence"
        | {
            width?: string;
            height?: string;
            position?: { x?: string; y?: string };
            padding?: number;
            aspectRatio?: string;
          };
      chromaKey?: boolean;
      chromaKeyColor?: string;
      similarity?: number;
      blend?: number;
    }>;
    outputDuration?: number;
    outputWidth?: number;
    outputHeight?: number;
  };
}

export interface ExecutionPlan {
  jobs: JobNode[];
  baseExecutionId?: string;
}

export interface JobNode {
  id: string;
  type: OperationType;
  params: Record<string, unknown>;
  dependsOn?: string[];
  output: string;
}

export interface PipelineProgress {
  currentJob: string;
  progress: number;
  totalJobs: number;
  completedJobs: number;
}

export interface PipelineExecution {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: MediaResult;
  onComplete(callback: (result: MediaResult) => void): void;
  onError(callback: (error: Error) => void): void;
}

export interface ExecuteOptions {
  /**
   * SYNTHOME_API_KEY for backend authorization.
   * If not provided, will attempt to read from SYNTHOME_API_KEY environment variable.
   */
  apiKey?: string;
  /**
   * Base URL for the API endpoint.
   * Defaults to http://localhost:3000/api/execute
   */
  apiUrl?: string;
  /**
   * Reference to a parent execution ID for dependency chaining.
   */
  baseExecutionId?: string;
  /**
   * Webhook URL to receive completion notification.
   */
  webhook?: string;
  /**
   * Secret for HMAC webhook signature verification.
   */
  webhookSecret?: string;
  /**
   * Provider API keys (e.g., Replicate, FAL, Google Cloud).
   * These keys are used by the backend to make API calls on your behalf.
   */
  providerApiKeys?: {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  };
}

export interface Pipeline {
  toJSON(): ExecutionPlan;
  execute(config?: ExecuteOptions): Promise<PipelineExecution>;
  onProgress(callback: (progress: PipelineProgress) => void): Pipeline;
  onError(callback: (error: Error) => void): Pipeline;
  getOperations(): VideoOperation[];
}
