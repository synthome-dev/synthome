import { VertexAI } from "@google-cloud/vertexai";
import type { ProviderCapabilities } from "@repo/model-schemas";
import { googleCloudCapabilities } from "@repo/model-schemas";
import type {
  AsyncGenerationStart,
  AsyncJobStatus,
  VideoGenerationResult,
  VideoProviderService,
} from "./base-provider.js";

export class GoogleCloudService implements VideoProviderService {
  private vertex: VertexAI;

  constructor(projectId?: string) {
    this.vertex = new VertexAI({
      project: projectId || process.env.GOOGLE_CLOUD_PROJECT!,
      location: "us-central1",
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    try {
      const generativeModel = this.vertex.getGenerativeModel({
        model: modelId,
      });

      const result = await generativeModel.generateContent(params as any);

      const fileUri =
        result.response.candidates?.[0]?.content?.parts?.[0]?.fileData?.fileUri;

      if (!fileUri) {
        throw new Error(
          `No video URL found in Google Cloud response: ${JSON.stringify(result)}`,
        );
      }

      return { url: fileUri };
    } catch (error) {
      console.error(`[GoogleCloudService] Failed to generate video:`, error);

      // Check if it's an authentication/API key error
      if (error && typeof error === "object") {
        const errorMessage = (error as any).message || "";
        const statusCode = (error as any).status || (error as any).code;

        // Check for authentication-related errors
        if (
          statusCode === 401 ||
          statusCode === 403 ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("authentication") ||
          errorMessage.toLowerCase().includes("credentials")
        ) {
          throw new Error(
            "Please configure your Google Cloud project ID in the dashboard or export GOOGLE_CLOUD_PROJECT in your environment",
          );
        }
      }

      throw error;
    }
  }

  async startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    webhook?: string,
  ): Promise<AsyncGenerationStart> {
    // Google Cloud Vertex AI doesn't support webhooks natively
    // Start the generation and return an operation ID for polling
    const generativeModel = this.vertex.getGenerativeModel({ model: modelId });

    // For now, we'll use a simplified approach
    // In production, you'd want to use Google Cloud Tasks or Pub/Sub
    throw new Error(
      "Google Cloud async generation not yet implemented - use polling",
    );
  }

  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    // Google Cloud uses long-running operations
    // This would query the operation status
    throw new Error("Google Cloud polling not yet implemented");
  }

  getCapabilities(): ProviderCapabilities {
    return googleCloudCapabilities;
  }
}
