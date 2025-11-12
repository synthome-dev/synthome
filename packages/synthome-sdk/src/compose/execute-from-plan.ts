import type {
  ExecutionPlan,
  ExecuteOptions,
  PipelineExecution,
} from "../core/video.js";
import { getSynthomeApiKey, getSynthomeApiUrl } from "../utils/api-key.js";

/**
 * MediaExecution class - handles execution lifecycle
 * (Copied from pipeline.ts to avoid circular dependency)
 */
class MediaExecution implements PipelineExecution {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" = "pending";
  result?: any;
  error?: string;
  completedAt?: Date;
  private completeCallback?: (video: any) => void;
  private errorCallback?: (error: Error) => void;

  constructor(
    id: string,
    private apiUrl: string,
    private apiKey?: string,
  ) {
    this.id = id;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  onComplete(callback: (video: any) => void): void {
    this.completeCallback = callback;
    if (this.result && this.status === "completed") {
      callback(this.result);
    }
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
    };
  }

  async getStatus() {
    const statusUrl = `${this.apiUrl}/${this.id}/status`;

    const response = await fetch(statusUrl, {
      headers: {
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch status: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    this.status = data.status;
    this.result = data.result;
    this.error = data.error;
    this.completedAt = data.completedAt
      ? new Date(data.completedAt)
      : undefined;

    return data;
  }

  async waitForCompletion(
    progressCallback?: (progress: any) => void,
  ): Promise<void> {
    const pollInterval = 2000;
    const maxAttempts = 300;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getStatus();

        if (progressCallback && status.progress) {
          progressCallback(status.progress);
        }

        if (this.status === "completed") {
          if (this.completeCallback && this.result) {
            this.completeCallback(this.result);
          }
          return;
        }

        if (this.status === "failed") {
          const error = new Error(this.error || "Execution failed");
          if (this.errorCallback) {
            this.errorCallback(error);
          }
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        if (this.status === "failed") {
          throw error;
        }
        console.error("Error polling execution status:", error);
        throw error;
      }
    }

    throw new Error("Execution timed out after maximum polling attempts");
  }
}

/**
 * Execute jobs directly from an ExecutionPlan (from pipeline.toJSON())
 *
 * This allows you to:
 * 1. Create a pipeline with compose()
 * 2. Get the JSON with pipeline.toJSON()
 * 3. Store/modify the JSON
 * 4. Execute it later with executeFromPlan()
 *
 * @example
 * ```typescript
 * // Step 1: Create pipeline and get JSON
 * const pipeline = compose(generateImage({ model: ..., prompt: "..." }));
 * const plan = pipeline.toJSON();
 *
 * // Step 2: Save to database or modify
 * await db.savePlan(plan);
 *
 * // Step 3: Execute later
 * const execution = await executeFromPlan(plan);
 * ```
 */
export async function executeFromPlan(
  plan: ExecutionPlan,
  options?: ExecuteOptions,
): Promise<PipelineExecution> {
  // Validate the plan
  validateExecutionPlan(plan);

  // Get API configuration
  const apiUrl = options?.apiUrl || getSynthomeApiUrl();
  const apiKey = options?.apiKey || getSynthomeApiKey();

  // Prepare provider API keys
  const providerApiKeys =
    options?.providerApiKeys || getProviderApiKeysFromEnv();

  // Make API request
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify({
      executionPlan: plan,
      options: {
        webhook: options?.webhook,
        webhookSecret: options?.webhookSecret,
        baseExecutionId: options?.baseExecutionId || plan.baseExecutionId,
        providerApiKeys,
      },
    }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to create execution: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const execution = new MediaExecution(data.executionId, apiUrl, apiKey);
  execution.status = data.status || "pending";

  // If no webhook URL provided, wait for completion (blocking mode)
  if (!options?.webhook) {
    await execution.waitForCompletion();
  }

  return execution;
}

/**
 * Validate execution plan structure
 */
function validateExecutionPlan(plan: ExecutionPlan): void {
  if (!plan) {
    throw new Error("ExecutionPlan is required");
  }

  if (!plan.jobs || !Array.isArray(plan.jobs)) {
    throw new Error("ExecutionPlan must contain a 'jobs' array");
  }

  if (plan.jobs.length === 0) {
    throw new Error("ExecutionPlan must contain at least one job");
  }

  for (const job of plan.jobs) {
    if (!job.id) {
      throw new Error("Each job must have an 'id' field");
    }
    if (!job.type) {
      throw new Error(`Job '${job.id}' must have a 'type' field`);
    }
    if (!job.params) {
      throw new Error(`Job '${job.id}' must have a 'params' object`);
    }
  }
}

/**
 * Attempts to read provider API keys from environment variables
 */
function getProviderApiKeysFromEnv():
  | {
      replicate?: string;
      fal?: string;
      "google-cloud"?: string;
    }
  | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const keys: {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  } = {};

  if (process.env.REPLICATE_API_KEY) {
    keys.replicate = process.env.REPLICATE_API_KEY;
  }

  if (process.env.FAL_KEY) {
    keys.fal = process.env.FAL_KEY;
  }

  if (process.env.GOOGLE_CLOUD_API_KEY) {
    keys["google-cloud"] = process.env.GOOGLE_CLOUD_API_KEY;
  }

  return Object.keys(keys).length > 0 ? keys : undefined;
}
