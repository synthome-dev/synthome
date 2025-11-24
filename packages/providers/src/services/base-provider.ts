import type {
  ProviderCapabilities,
  WaitingStrategy,
} from "@repo/model-schemas";

export interface VideoGenerationResult {
  url?: string; // Optional for non-media results
  data?: any; // Structured data (e.g. transcript)
  metadata?: Record<string, unknown>;
}

/**
 * Result of starting an async video generation
 */
export interface AsyncGenerationStart {
  providerJobId: string;
  waitingStrategy: WaitingStrategy;
  estimatedCompletionTime?: number; // seconds
}

/**
 * Status of an async job
 */
export interface AsyncJobStatus {
  status: "processing" | "completed" | "failed";
  result?: VideoGenerationResult;
  error?: string;
  progress?: number; // 0-100
}

export interface VideoProviderService {
  /**
   * Legacy synchronous method - waits for video to complete
   * @deprecated Use startGeneration for better async handling
   */
  generateVideo(
    modelId: string,
    params: Record<string, unknown>,
  ): Promise<VideoGenerationResult>;

  /**
   * Start video generation without waiting for completion
   * Returns a job ID that can be used to check status or receive webhooks
   */
  startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    webhook?: string,
  ): Promise<AsyncGenerationStart>;

  /**
   * Get the status of an async job (for polling)
   */
  getJobStatus(providerJobId: string): Promise<AsyncJobStatus>;

  /**
   * Get the raw provider response (for custom parsing)
   * Optional - providers can implement this for models that need custom parsing
   */
  getRawJobResponse?(providerJobId: string): Promise<unknown>;

  /**
   * Get provider capabilities (webhook/polling support)
   */
  getCapabilities(): ProviderCapabilities;
}
