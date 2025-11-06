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
  | "addSubtitles";

export interface VideoOperation {
  type: OperationType;
  params: Record<string, unknown>;
  inputs?: VideoNode[];
}

export interface ImageOperation {
  type: "generateImage";
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
  apiKey?: string;
  apiUrl?: string;
  baseExecutionId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface Pipeline {
  toJSON(): ExecutionPlan;
  execute(config?: ExecuteOptions): Promise<PipelineExecution>;
  onProgress(callback: (progress: PipelineProgress) => void): Pipeline;
  getOperations(): VideoOperation[];
}
