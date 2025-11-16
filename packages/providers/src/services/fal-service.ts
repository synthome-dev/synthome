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
      credentials: apiKey || process.env.FAL_KEY!,
    });
  }

  async generateVideo(
    modelId: string,
    params: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    try {
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
    } catch (error) {
      console.error(`[FalService] Failed to generate video:`, error);

      // Check if it's an authentication/API key error
      if (error && typeof error === "object") {
        const errorMessage = (error as any).message || "";
        const statusCode = (error as any).status || (error as any).statusCode;

        // Check for 401 Unauthorized or authentication-related errors
        if (
          statusCode === 401 ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("authentication") ||
          errorMessage.toLowerCase().includes("api key")
        ) {
          throw new Error(
            "Please configure your Fal API key in the dashboard or export FAL_KEY in your environment",
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
    try {
      const { request_id } = await fal.queue.submit(modelId, {
        input: params,
        webhookUrl: webhook,
      });

      return {
        providerJobId: `${modelId}::${request_id}`, // Store modelId with the job ID
        waitingStrategy: "polling", // Changed from "webhook" to "polling"
      };
    } catch (error) {
      console.error(`[FalService] Failed to start generation:`, error);

      // Check if it's an authentication/API key error
      if (error && typeof error === "object") {
        const errorMessage = (error as any).message || "";
        const statusCode = (error as any).status || (error as any).statusCode;

        // Check for 401 Unauthorized or authentication-related errors
        if (
          statusCode === 401 ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("authentication") ||
          errorMessage.toLowerCase().includes("api key")
        ) {
          throw new Error(
            "Please configure your Fal API key in the dashboard or export FAL_KEY in your environment",
          );
        }
      }

      throw error;
    }
  }

  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    // Extract modelId from the composite providerJobId
    const [modelId, requestId] = providerJobId.split("::");

    if (!modelId || !requestId) {
      throw new Error(
        "Invalid providerJobId format. Expected modelId::requestId",
      );
    }

    try {
      // First, check the status
      const status: any = await fal.queue.status(modelId, {
        requestId: requestId,
        logs: false,
      });

      console.log(`[FalService] Status for ${requestId}:`, status.status);
      console.log(
        `[FalService] Full status object:`,
        JSON.stringify(status, null, 2),
      );

      // If completed, we need to fetch the actual result
      // FAL's queue.status() doesn't include the output, only metadata
      if (status.status === "COMPLETED") {
        console.log(`[FalService] Job completed, fetching result...`);

        try {
          const result = await fal.queue.result(modelId, {
            requestId: requestId,
          });

          console.log(
            `[FalService] Result received:`,
            JSON.stringify(result, null, 2),
          );

          // Return the result so the parser can extract the video URL
          return {
            status: "processing", // Placeholder - parser will determine actual status
            result: result as any,
          };
        } catch (resultError: any) {
          console.error(`[FalService] Error fetching result:`, resultError);
          console.error(`[FalService] Error details:`, resultError?.body);

          // If we can't fetch the result, maybe the status object has the response_url
          // Try using that instead
          if (status.response_url) {
            console.log(
              `[FalService] Attempting to fetch from response_url:`,
              status.response_url,
            );
            try {
              const response = await fetch(status.response_url);
              const result = await response.json();
              console.log(
                `[FalService] Result from response_url:`,
                JSON.stringify(result, null, 2),
              );

              return {
                status: "processing",
                result: result as any,
              };
            } catch (fetchError) {
              console.error(
                `[FalService] Error fetching from response_url:`,
                fetchError,
              );
            }
          }

          // If all else fails, return an error status
          return {
            status: "processing",
            error: `Failed to fetch result: ${resultError.message}`,
          };
        }
      }

      // For other statuses (IN_PROGRESS, IN_QUEUE, FAILED), return the status
      return {
        status: "processing", // Placeholder - will be determined by parser
        result: status as any,
      };
    } catch (error) {
      console.error(`[FalService] Error getting job status:`, error);
      return {
        status: "processing", // Default to processing on error
      };
    }
  }

  getCapabilities(): ProviderCapabilities {
    return falCapabilities;
  }
}
