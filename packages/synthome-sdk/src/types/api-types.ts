/**
 * Response from POST /api/execute
 */
export interface ExecuteResponse {
  executionId: string;
  status: "pending";
  createdAt: string;
}

/**
 * Media output result from a completed execution
 */
export interface MediaResult {
  url: string;
  type?: "video" | "audio" | "image";
  duration?: number;
  format?: string;
  size?: number;
  [key: string]: any; // Allow additional metadata
}

/**
 * Response from GET /api/execute/:id/status
 */
export interface ExecutionStatusResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  jobs: JobStatus[];
  result: MediaResult | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

/**
 * Job status information
 */
export interface JobStatus {
  id: string;
  operation: string;
  status: string;
  result: any;
  error: string | null;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}
