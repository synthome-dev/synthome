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
        jobs.push({
          id,
          type: op.type,
          params: op.params,
          output: `$${id}`,
        });
        mergeInputs.push(id);
      } else if (op.type === "generate" && mergeInputs.length > 0) {
        jobs.push({
          id,
          type: op.type,
          params: op.params,
          output: `$${id}`,
        });
        mergeInputs.push(id);
      } else {
        const dependsOn = lastJobId ? [lastJobId] : undefined;
        jobs.push({
          id,
          type: op.type,
          params: op.params,
          dependsOn,
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
