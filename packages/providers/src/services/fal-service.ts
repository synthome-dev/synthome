import * as fal from "@fal-ai/serverless-client";
import type {
  VideoProviderService,
  VideoGenerationResult,
} from "./base-provider.js";

export class FalService implements VideoProviderService {
  constructor(apiKey?: string) {
    fal.config({
      credentials: apiKey || process.env.FAL_API_KEY!,
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, any>,
  ): Promise<VideoGenerationResult> {
    const result: any = await fal.subscribe(modelId, {
      input: params,
    });

    const url = result.video?.url || result.data?.video?.url;
    if (!url) {
      throw new Error(
        `No video URL found in Fal response: ${JSON.stringify(result)}`,
      );
    }

    return { url, metadata: result };
  }
}
