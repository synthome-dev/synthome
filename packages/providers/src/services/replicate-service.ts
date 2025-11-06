import type { ProviderCapabilities } from "@repo/model-schemas";
import { replicateCapabilities } from "@repo/model-schemas";
import Replicate from "replicate";
import type {
  AsyncGenerationStart,
  AsyncJobStatus,
  VideoGenerationResult,
  VideoProviderService,
} from "./base-provider.js";

export class ReplicateService implements VideoProviderService {
  private client: Replicate;

  constructor(apiKey?: string) {
    this.client = new Replicate({
      auth: apiKey || process.env.REPLICATE_API_KEY!,
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    const output = await this.client.run(modelId as `${string}/${string}`, {
      input: params,
    });

    let url: string;
    if (Array.isArray(output)) {
      url = output[0] as string;
    } else if (typeof output === "string") {
      url = output;
    } else {
      throw new Error(`Unexpected output format from Replicate: ${output}`);
    }

    return { url };
  }

  async startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    webhookUrl?: string,
  ): Promise<AsyncGenerationStart> {
    const createOptions: any = {
      version: modelId,
      input: params,
    };

    // Only include webhook options if webhook URL is provided
    if (webhookUrl) {
      createOptions.webhook = webhookUrl;
      createOptions.webhook_events_filter = ["completed"];
    }

    const prediction = await this.client.predictions.create(createOptions);

    return {
      providerJobId: prediction.id,
      waitingStrategy: webhookUrl ? "webhook" : "polling",
    };
  }

  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    const prediction = await this.client.predictions.get(providerJobId);

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return {
        status: "failed",
        error: prediction.error?.toString() || "Generation failed",
      };
    }

    if (prediction.status === "succeeded") {
      let url: string;
      if (Array.isArray(prediction.output)) {
        url = prediction.output[0] as string;
      } else if (typeof prediction.output === "string") {
        url = prediction.output;
      } else {
        return {
          status: "failed",
          error: "Unexpected output format",
        };
      }

      return {
        status: "completed",
        result: { url },
      };
    }

    return {
      status: "processing",
    };
  }

  async getRawJobResponse(providerJobId: string): Promise<unknown> {
    return await this.client.predictions.get(providerJobId);
  }

  getCapabilities(): ProviderCapabilities {
    return replicateCapabilities;
  }
}
