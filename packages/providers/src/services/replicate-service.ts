import type { ProviderCapabilities } from "@repo/model-schemas";
import { replicateCapabilities, getModelInfo } from "@repo/model-schemas";
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
    webhook?: string,
  ): Promise<AsyncGenerationStart> {
    // Transform parameters for specific models
    const transformedParams = this.transformParams(modelId, params);

    console.log(
      `[ReplicateService] startGeneration called with modelId: ${modelId}`,
    );
    console.log(
      `[ReplicateService] Transformed params:`,
      JSON.stringify(transformedParams, null, 2),
    );

    // Get the provider model ID (version hash) from registry
    const modelInfo = getModelInfo(modelId);
    const providerModelId = modelInfo?.providerModelId;

    const createOptions: any = {
      input: transformedParams,
    };

    // Use version hash if provided, otherwise use model identifier
    if (providerModelId) {
      console.log(`[ReplicateService] Using version hash: ${providerModelId}`);
      createOptions.version = providerModelId;
    } else {
      console.log(`[ReplicateService] Using model identifier: ${modelId}`);
      createOptions.model = modelId;
    }

    // Only include webhook options if webhook URL is provided
    if (webhook) {
      createOptions.webhook = webhook;
      createOptions.webhook_events_filter = ["completed"];
    }

    console.log(
      `[ReplicateService] Creating prediction with options:`,
      JSON.stringify(createOptions, null, 2),
    );

    try {
      const prediction = await this.client.predictions.create(createOptions);

      console.log(
        `[ReplicateService] Prediction created successfully:`,
        JSON.stringify(prediction, null, 2),
      );

      return {
        providerJobId: prediction.id,
        waitingStrategy: webhook ? "webhook" : "polling",
      };
    } catch (error) {
      console.error(`[ReplicateService] Failed to create prediction:`, error);
      throw error;
    }
  }

  /**
   * Transform parameters for specific model requirements
   */
  private transformParams(
    modelId: string,
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    // ElevenLabs models expect 'prompt' instead of 'text'
    if (modelId.includes("elevenlabs")) {
      const { text, ...rest } = params;
      if (text !== undefined) {
        return { prompt: text, ...rest };
      }
    }

    return params;
  }

  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    console.log(`[ReplicateService] Getting job status for: ${providerJobId}`);

    const prediction = await this.client.predictions.get(providerJobId);

    console.log(
      `[ReplicateService] Prediction status:`,
      JSON.stringify(prediction, null, 2),
    );

    if (prediction.status === "failed" || prediction.status === "canceled") {
      console.error(
        `[ReplicateService] Prediction failed/canceled. Error:`,
        prediction.error,
      );
      console.error(
        `[ReplicateService] Full prediction object:`,
        JSON.stringify(prediction, null, 2),
      );
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
