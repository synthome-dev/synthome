import * as fal from "@fal-ai/serverless-client";
import { falCapabilities } from "@repo/model-schemas";
import type {
  VideoProviderService,
  VideoGenerationResult,
  AsyncGenerationStart,
  AsyncJobStatus,
} from "./base-provider.js";
import type { ProviderCapabilities } from "@repo/model-schemas";

export class FalService implements VideoProviderService {
  constructor(apiKey?: string) {
    fal.config({
      credentials: apiKey || process.env.FAL_API_KEY!,
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    const result: any = await fal.subscribe(modelId, {
      input: params,
    });

    const url = result.video?.url || result.data?.video?.url;
    if (!url) {
      throw new Error(
        `No video URL found in Fal response: ${JSON.stringify(result)}`
      );
    }

    return { url, metadata: result };
  }

  async startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    webhookUrl?: string
  ): Promise<AsyncGenerationStart> {
    const { request_id } = await fal.queue.submit(modelId, {
      input: params,
      webhookUrl,
    });

    return {
      providerJobId: request_id,
      waitingStrategy: "webhook",
    };
  }

  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    // Note: FAL's queue.status API requires both modelId and requestId
    // We'll need to store modelId with the job or pass it as a parameter
    // For now, returning processing to rely on webhooks
    return {
      status: "processing",
    };
  }

  getCapabilities(): ProviderCapabilities {
    return falCapabilities;
  }
}
