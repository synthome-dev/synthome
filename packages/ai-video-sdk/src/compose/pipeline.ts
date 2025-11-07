import type {
  ExecuteOptions,
  ExecutionPlan,
  JobNode,
  Pipeline,
  PipelineExecution,
  PipelineProgress,
  Video,
  VideoNode,
  VideoOperation,
  ImageOperation,
  AudioOperation,
} from "../core/video.js";

export type { Pipeline, PipelineProgress, PipelineExecution, ExecuteOptions };

class VideoExecution implements PipelineExecution {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" = "pending";
  private completeCallback?: (video: Video) => void;
  private result?: Video;

  constructor(
    id: string,
    private apiUrl: string,
    private apiKey?: string,
  ) {
    this.id = id;
  }

  onComplete(callback: (video: Video) => void): void {
    this.completeCallback = callback;
    if (this.result && this.status === "completed") {
      callback(this.result);
    }
  }

  async waitForCompletion(
    progressCallback?: (progress: PipelineProgress) => void,
  ): Promise<Video> {
    const statusUrl = `${this.apiUrl}/${this.id}/status`;
    const interval = 3000;

    while (true) {
      const response = await fetch(statusUrl, {
        headers: {
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const status = (await response.json()) as {
        status: Video["status"];
        progress: number;
        totalJobs: number;
        completedJobs: number;
        currentJob: string;
        result?: Video;
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

      if (status.status === "completed" && status.result) {
        this.result = status.result;
        if (this.completeCallback) {
          this.completeCallback(status.result);
        }
        return status.result;
      }

      if (status.status === "failed") {
        throw new Error("Pipeline execution failed");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

class VideoPipeline implements Pipeline {
  private operations: VideoOperation[] = [];
  private progressCallback?: (progress: PipelineProgress) => void;

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
          // Create a video generation job
          const videoId = `job${counter++}`;
          jobs.push({
            id: videoId,
            type: "generate",
            params: videoOp.params,
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
    const apiUrl = config?.apiUrl || "http://localhost:3000/api/execute";

    if (config?.baseExecutionId) {
      plan.baseExecutionId = config.baseExecutionId;
    }

    const requestBody: Record<string, unknown> = {
      ...plan,
    };

    if (config?.webhookUrl) {
      requestBody.webhook = {
        url: config.webhookUrl,
        secret: config.webhookSecret,
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config?.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Pipeline execution failed: ${response.statusText}`);
    }

    const { executionId } = (await response.json()) as { executionId: string };

    const execution = new VideoExecution(executionId, apiUrl, config?.apiKey);

    if (!config?.webhookUrl) {
      execution.waitForCompletion(this.progressCallback);
    }

    return execution;
  }

  onProgress(callback: (progress: PipelineProgress) => void): Pipeline {
    this.progressCallback = callback;
    return this;
  }
}

export function compose(...nodes: VideoNode[]): Pipeline {
  return new VideoPipeline(nodes);
}
