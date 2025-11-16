import type {
  AudioOperation,
  ExecuteOptions,
  ExecutionPlan,
  ImageOperation,
  JobNode,
  MediaResult,
  Pipeline,
  PipelineExecution,
  PipelineProgress,
  VideoNode,
  VideoOperation,
} from "../core/video.js";
import { getSynthomeApiKey, getSynthomeApiUrl } from "../utils/api-key.js";
import { getModelInfo, type VideoProvider } from "../schemas/registry.js";
import type { ExecutionStatusResponse } from "../types/api-types.js";

export type { ExecuteOptions, Pipeline, PipelineExecution, PipelineProgress };

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

class MediaExecution implements PipelineExecution {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" = "pending";
  result?: MediaResult;
  private completeCallback?: (result: MediaResult) => void;
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

  onComplete(callback: (result: MediaResult) => void): void {
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

  async getStatus(): Promise<ExecutionStatusResponse> {
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
        if (errorBody.error || errorBody.message) {
          errorMessage = `Failed to fetch status: ${errorBody.error || errorBody.message}`;
        }
      } catch {
        // If JSON parsing fails, use the status text
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async waitForCompletion(
    progressCallback?: (progress: PipelineProgress) => void,
  ): Promise<MediaResult> {
    const statusUrl = `${this.apiUrl}/${this.id}/status`;
    const interval = 1000; // Poll every 1 second (faster for audio/quick operations)

    try {
      while (true) {
        const response = await fetch(statusUrl, {
          headers: {
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
        });

        if (!response.ok) {
          let errorMessage = `Failed to fetch status: ${response.statusText}`;
          try {
            const errorBody = await response.json();
            if (errorBody.error || errorBody.message) {
              errorMessage = `Failed to fetch status: ${errorBody.error || errorBody.message}`;
              if (errorBody.code) {
                errorMessage += ` (${errorBody.code})`;
              }
            }
          } catch {
            // If JSON parsing fails, use the status text
          }
          const error = new Error(errorMessage);
          if (this.errorCallback) {
            this.errorCallback(error);
            throw error; // Still throw after callback
          }
          throw error;
        }

        const status = (await response.json()) as {
          status: MediaResult["status"];
          progress: number;
          totalJobs: number;
          completedJobs: number;
          currentJob: string;
          result?: MediaResult;
          error?: string | null;
        };

        this.status = status.status;

        if (progressCallback) {
          progressCallback({
            currentJob: status.currentJob,
            progress: status.progress,
            totalJobs: status.totalJobs,
            completedJobs: status.completedJobs,
          });
        }

        if (status.status === "completed") {
          this.result = status.result;
          if (this.completeCallback && status.result) {
            this.completeCallback(status.result);
          }
          return status.result!;
        }

        if (status.status === "failed") {
          console.log("[SDK] Execution failed, status response:", status);
          const errorMessage = status.error || "Pipeline execution failed";
          console.log("[SDK] Error message:", errorMessage);
          const error = new Error(errorMessage);
          if (this.errorCallback) {
            this.errorCallback(error);
          }
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    } catch (error) {
      if (this.errorCallback && error instanceof Error) {
        this.errorCallback(error);
      }
      throw error;
    }
  }
}

class VideoPipeline implements Pipeline {
  private operations: VideoOperation[] = [];
  private progressCallback?: (progress: PipelineProgress) => void;
  private errorCallback?: (error: Error) => void;

  constructor(nodes: VideoNode[]) {
    this.operations = this.flattenNodes(nodes);
  }

  private flattenNodes(nodes: VideoNode[]): VideoOperation[] {
    const operations: VideoOperation[] = [];

    for (const node of nodes) {
      if (this.isPipeline(node)) {
        operations.push(...node.getOperations());
      } else if (this.isOperation(node)) {
        operations.push(node);
      }
    }

    return operations;
  }

  private isPipeline(node: VideoNode): node is Pipeline {
    return "toJSON" in node && "execute" in node && "getOperations" in node;
  }

  private isOperation(node: VideoNode): node is VideoOperation {
    return "type" in node && "params" in node;
  }

  /**
   * Filters provider API keys to only include keys for providers used in the execution plan
   */
  private filterProviderApiKeys(
    plan: ExecutionPlan,
    apiKeys: {
      replicate?: string;
      fal?: string;
      "google-cloud"?: string;
    },
  ): {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  } {
    const usedProviders = new Set<VideoProvider>();

    // Extract all modelIds from the execution plan
    for (const job of plan.jobs) {
      if (
        job.params &&
        typeof job.params === "object" &&
        "modelId" in job.params
      ) {
        const modelId = job.params.modelId;
        if (typeof modelId === "string") {
          const modelInfo = getModelInfo(modelId);
          if (modelInfo) {
            usedProviders.add(modelInfo.provider);
          }
        }
      }
    }

    // Filter API keys to only include keys for used providers
    const filteredKeys: {
      replicate?: string;
      fal?: string;
      "google-cloud"?: string;
    } = {};

    if (usedProviders.has("replicate") && apiKeys.replicate) {
      filteredKeys.replicate = apiKeys.replicate;
    }
    if (usedProviders.has("fal") && apiKeys.fal) {
      filteredKeys.fal = apiKeys.fal;
    }
    if (usedProviders.has("google-cloud") && apiKeys["google-cloud"]) {
      filteredKeys["google-cloud"] = apiKeys["google-cloud"];
    }

    return filteredKeys;
  }

  getOperations(): VideoOperation[] {
    return [...this.operations];
  }

  toJSON(): ExecutionPlan {
    const jobs: JobNode[] = [];
    let counter = 1;
    let mergeInputs: string[] = [];
    let lastJobId: string | undefined;

    for (let i = 0; i < this.operations.length; i++) {
      const op = this.operations[i];
      if (!op) continue;

      const id = `job${counter++}`;

      // Check if this operation has a nested ImageOperation in params.image
      let imageJobId: string | undefined;
      if (op.params.image && typeof op.params.image === "object") {
        const imageOp = op.params.image as ImageOperation;
        if (
          imageOp.type === "generateImage" ||
          imageOp.type === "removeImageBackground"
        ) {
          // Check if the imageOp itself has a nested image operation
          let nestedImageJobId: string | undefined;
          if (
            imageOp.params.image &&
            typeof imageOp.params.image === "object"
          ) {
            const nestedImageOp = imageOp.params.image as ImageOperation;
            if (
              nestedImageOp.type === "generateImage" ||
              nestedImageOp.type === "removeImageBackground"
            ) {
              // Create the nested image job first
              const nestedImageId = `job${counter++}`;
              jobs.push({
                id: nestedImageId,
                type: nestedImageOp.type,
                params: nestedImageOp.params,
                output: `$${nestedImageId}`,
              });
              nestedImageJobId = nestedImageId;
            }
          }

          // Create an image generation/processing job
          const imageId = `job${counter++}`;
          const imageParams = { ...imageOp.params };
          if (nestedImageJobId) {
            imageParams.image = `_imageJobDependency:${nestedImageJobId}`;
          }

          jobs.push({
            id: imageId,
            type: imageOp.type,
            params: imageParams,
            dependsOn: nestedImageJobId ? [nestedImageJobId] : undefined,
            output: `$${imageId}`,
          });
          imageJobId = imageId;
        }
      }

      // Check if this operation has a nested AudioOperation in params.audio
      let audioJobId: string | undefined;
      if (op.params.audio && typeof op.params.audio === "object") {
        const audioOp = op.params.audio as AudioOperation;
        if (audioOp.type === "generateAudio") {
          // Create an audio generation job
          const audioId = `job${counter++}`;
          jobs.push({
            id: audioId,
            type: "generateAudio",
            params: audioOp.params,
            output: `$${audioId}`,
          });
          audioJobId = audioId;
        }
      }

      // Check if this operation has a nested VideoOperation in params.video
      let videoJobId: string | undefined;
      if (op.params.video && typeof op.params.video === "object") {
        const videoOp = op.params.video as VideoOperation;
        if (videoOp.type === "generate") {
          // Check if the nested video operation has its own nested image/audio operations
          let nestedVideoImageJobId: string | undefined;
          let nestedVideoAudioJobId: string | undefined;

          // Handle nested image in the video operation
          if (
            videoOp.params.image &&
            typeof videoOp.params.image === "object"
          ) {
            const nestedImageOp = videoOp.params.image as ImageOperation;
            if (
              nestedImageOp.type === "generateImage" ||
              nestedImageOp.type === "removeImageBackground"
            ) {
              const nestedImageId = `job${counter++}`;
              jobs.push({
                id: nestedImageId,
                type: nestedImageOp.type,
                params: nestedImageOp.params,
                output: `$${nestedImageId}`,
              });
              nestedVideoImageJobId = nestedImageId;
            }
          }

          // Handle nested audio in the video operation
          if (
            videoOp.params.audio &&
            typeof videoOp.params.audio === "object"
          ) {
            const nestedAudioOp = videoOp.params.audio as AudioOperation;
            if (nestedAudioOp.type === "generateAudio") {
              const nestedAudioId = `job${counter++}`;
              jobs.push({
                id: nestedAudioId,
                type: "generateAudio",
                params: nestedAudioOp.params,
                output: `$${nestedAudioId}`,
              });
              nestedVideoAudioJobId = nestedAudioId;
            }
          }

          // Create a video generation job with dependency markers
          const videoId = `job${counter++}`;
          const videoParams = { ...videoOp.params };

          // Replace nested operations with dependency markers
          if (nestedVideoImageJobId) {
            videoParams.image = `_imageJobDependency:${nestedVideoImageJobId}`;
          }
          if (nestedVideoAudioJobId) {
            videoParams.audio = `_audioJobDependency:${nestedVideoAudioJobId}`;
          }

          const videoDeps = [
            nestedVideoImageJobId,
            nestedVideoAudioJobId,
          ].filter((id): id is string => id !== undefined);

          jobs.push({
            id: videoId,
            type: "generate",
            params: videoParams,
            dependsOn: videoDeps.length > 0 ? videoDeps : undefined,
            output: `$${videoId}`,
          });
          videoJobId = videoId;
        }
      }

      // Collect all dependency job IDs
      const depJobIds = [imageJobId, audioJobId, videoJobId].filter(
        (id): id is string => id !== undefined,
      );

      if (op.type === "merge") {
        jobs.push({
          id,
          type: op.type,
          params: op.params,
          dependsOn:
            mergeInputs.length > 0
              ? mergeInputs
              : lastJobId
                ? [lastJobId]
                : undefined,
          output: `$${id}`,
        });
        mergeInputs = [];
        lastJobId = id;
      } else if (
        op.type === "generate" &&
        this.operations[i + 1]?.type === "generate"
      ) {
        // Multi-scene generation - create job with dependencies
        const jobParams = { ...op.params };
        if (imageJobId) {
          jobParams.image = `_imageJobDependency:${imageJobId}`;
        }
        if (audioJobId) {
          jobParams.audio = `_audioJobDependency:${audioJobId}`;
        }
        if (videoJobId) {
          jobParams.video = `_videoJobDependency:${videoJobId}`;
        }

        jobs.push({
          id,
          type: op.type,
          params: jobParams,
          dependsOn: depJobIds.length > 0 ? depJobIds : undefined,
          output: `$${id}`,
        });
        mergeInputs.push(id);
      } else if (op.type === "generate" && mergeInputs.length > 0) {
        // Part of multi-scene - create job with dependencies
        const jobParams = { ...op.params };
        if (imageJobId) {
          jobParams.image = `_imageJobDependency:${imageJobId}`;
        }
        if (audioJobId) {
          jobParams.audio = `_audioJobDependency:${audioJobId}`;
        }
        if (videoJobId) {
          jobParams.video = `_videoJobDependency:${videoJobId}`;
        }

        jobs.push({
          id,
          type: op.type,
          params: jobParams,
          dependsOn: depJobIds.length > 0 ? depJobIds : undefined,
          output: `$${id}`,
        });
        mergeInputs.push(id);
      } else {
        // Single operation or non-generate - create job with dependencies
        const jobParams = { ...op.params };
        if (imageJobId) {
          jobParams.image = `_imageJobDependency:${imageJobId}`;
        }
        if (audioJobId) {
          jobParams.audio = `_audioJobDependency:${audioJobId}`;
        }
        if (videoJobId) {
          jobParams.video = `_videoJobDependency:${videoJobId}`;
        }

        const allDeps = [...depJobIds];
        if (lastJobId) allDeps.unshift(lastJobId);

        jobs.push({
          id,
          type: op.type,
          params: jobParams,
          dependsOn: allDeps.length > 0 ? allDeps : undefined,
          output: `$${id}`,
        });
        lastJobId = id;
      }
    }

    return { jobs };
  }

  async execute(config?: ExecuteOptions): Promise<PipelineExecution> {
    const plan = this.toJSON();
    const apiUrl = getSynthomeApiUrl(config?.apiUrl);

    // Get SYNTHOME_API_KEY for backend authorization
    const synthomeApiKey = getSynthomeApiKey(config?.apiKey);

    if (config?.baseExecutionId) {
      plan.baseExecutionId = config.baseExecutionId;
    }

    // Automatically get provider API keys from environment if not provided
    let providerApiKeys =
      config?.providerApiKeys || getProviderApiKeysFromEnv();

    // Only send keys for providers that are actually used in the pipeline
    if (providerApiKeys && Object.keys(providerApiKeys).length > 0) {
      providerApiKeys = this.filterProviderApiKeys(plan, providerApiKeys);
    }

    // Build options object with webhook and providerApiKeys
    const options: Record<string, unknown> = {};

    if (config?.webhook) {
      options.webhook = {
        url: config.webhook,
        secret: config.webhookSecret,
      };
    }

    // Only include providerApiKeys if at least one key is present
    if (providerApiKeys && Object.keys(providerApiKeys).length > 0) {
      options.providerApiKeys = providerApiKeys;
    }

    // Structure request body to match backend expectations
    const requestBody = {
      executionPlan: plan,
      options,
    };

    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${synthomeApiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      const error = new Error(
        `Failed to connect to API at ${apiUrl}. ` +
          `Error: ${fetchError instanceof Error ? fetchError.message : "Network error"}. ` +
          `Make sure the API server is running and the apiUrl is correct.`,
      );
      if (this.errorCallback) {
        this.errorCallback(error);
      }
      throw error;
    }

    if (!response.ok) {
      let errorMessage = `Pipeline execution failed: ${response.statusText}`;
      let errorDetails = "";
      try {
        const errorBody = await response.json();
        if (errorBody.error || errorBody.message) {
          errorMessage = `Pipeline execution failed: ${errorBody.error || errorBody.message}`;
          if (errorBody.code) {
            errorMessage += ` (${errorBody.code})`;
          }
        }
      } catch {
        // If JSON parsing fails, include more context
        errorDetails = ` [Request to ${apiUrl} returned ${response.status}]`;
      }
      const error = new Error(errorMessage + errorDetails);
      if (this.errorCallback) {
        this.errorCallback(error);
      }
      throw error;
    }

    const { executionId } = (await response.json()) as { executionId: string };

    const execution = new MediaExecution(executionId, apiUrl, synthomeApiKey);

    // Pass error callback from pipeline to execution
    if (this.errorCallback) {
      execution.onError(this.errorCallback);
    }

    if (!config?.webhook) {
      await execution.waitForCompletion(this.progressCallback);
    }

    return execution;
  }

  onProgress(callback: (progress: PipelineProgress) => void): Pipeline {
    this.progressCallback = callback;
    return this;
  }

  onError(callback: (error: Error) => void): Pipeline {
    this.errorCallback = callback;
    return this;
  }
}

export function compose(...nodes: VideoNode[]): Pipeline {
  return new VideoPipeline(nodes);
}

/**
 * Get execution status by ID
 * @param executionId - The execution ID to check
 * @param options - Optional API URL and API key (defaults to environment variables)
 */
export async function getExecutionStatus(
  executionId: string,
  options?: {
    apiUrl?: string;
    apiKey?: string;
  },
): Promise<ExecutionStatusResponse> {
  const apiUrl = getSynthomeApiUrl(options?.apiUrl);
  const apiKey = options?.apiKey ? options.apiKey : getSynthomeApiKey();

  const statusUrl = `${apiUrl}/${executionId}/status`;

  const response = await fetch(statusUrl, {
    headers: {
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch status: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error || errorBody.message) {
        errorMessage = `Failed to fetch status: ${errorBody.error || errorBody.message}`;
      }
    } catch {
      // If JSON parsing fails, use the status text
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
