import Replicate from "replicate";
import type {
  VideoProviderService,
  VideoGenerationResult,
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
    params: Record<string, any>,
  ): Promise<VideoGenerationResult> {
    const output = await this.client.run(modelId as `${string}/${string}`, {
      input: params,
    });

    let url: string;
    if (Array.isArray(output)) {
      url = output[0];
    } else if (typeof output === "string") {
      url = output;
    } else {
      throw new Error(`Unexpected output format from Replicate: ${output}`);
    }

    return { url };
  }
}
