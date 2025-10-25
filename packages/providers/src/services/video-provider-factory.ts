import type { VideoProvider } from "@repo/model-schemas";
import type { VideoProviderService } from "./base-provider.js";
import { ReplicateService } from "./replicate-service.js";
import { FalService } from "./fal-service.js";
import { GoogleCloudService } from "./google-cloud-service.js";

export class VideoProviderFactory {
  private static replicateInstance: ReplicateService | null = null;
  private static falInstance: FalService | null = null;
  private static googleCloudInstance: GoogleCloudService | null = null;

  static getProvider(provider: VideoProvider): VideoProviderService {
    switch (provider) {
      case "replicate":
        if (!this.replicateInstance) {
          this.replicateInstance = new ReplicateService();
        }
        return this.replicateInstance;

      case "fal":
        if (!this.falInstance) {
          this.falInstance = new FalService();
        }
        return this.falInstance;

      case "google-cloud":
        if (!this.googleCloudInstance) {
          this.googleCloudInstance = new GoogleCloudService();
        }
        return this.googleCloudInstance;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  static reset() {
    this.replicateInstance = null;
    this.falInstance = null;
    this.googleCloudInstance = null;
  }
}
