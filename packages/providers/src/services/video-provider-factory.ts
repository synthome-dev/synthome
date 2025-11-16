import type { VideoProvider } from "@repo/model-schemas";
import type { VideoProviderService } from "./base-provider.js";
import { ReplicateService } from "./replicate-service.js";
import { FalService } from "./fal-service.js";
import { GoogleCloudService } from "./google-cloud-service.js";
import { HumeService } from "./hume-service.js";
import { ElevenLabsService } from "./elevenlabs-service.js";

export class VideoProviderFactory {
  static getProvider(
    provider: VideoProvider,
    apiKey?: string,
  ): VideoProviderService {
    switch (provider) {
      case "replicate":
        return new ReplicateService(apiKey);

      case "fal":
        return new FalService(apiKey);

      case "google-cloud":
        return new GoogleCloudService(apiKey);

      case "hume":
        return new HumeService(apiKey);

      case "elevenlabs":
        return new ElevenLabsService(apiKey);

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
