export interface Video {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  aspectRatio: string;
  duration: number;
}

export interface Image {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  width?: number;
  height?: number;
}

export interface Audio {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  duration?: number;
  mimeType?: string;
}

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
  | "replaceGreenScreen"
  | "removeImageBackground";

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
  onComplete(callback: (video: Video) => void): void;
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
  webhookUrl?: string;
  /**
   * Secret for HMAC webhook signature verification.
   */
  webhookSecret?: string;
}

export interface Pipeline {
  toJSON(): ExecutionPlan;
  execute(config?: ExecuteOptions): Promise<PipelineExecution>;
  onProgress(callback: (progress: PipelineProgress) => void): Pipeline;
  getOperations(): VideoOperation[];
}
