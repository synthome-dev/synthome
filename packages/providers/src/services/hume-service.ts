import type { ProviderCapabilities } from "@repo/model-schemas";
import { humeCapabilities } from "@repo/model-schemas";
import { generateId } from "@repo/tools";
import { HumeClient } from "hume";
import type {
  AsyncGenerationStart,
  AsyncJobStatus,
  VideoGenerationResult,
  VideoProviderService,
} from "./base-provider.js";

export class HumeService implements VideoProviderService {
  private client: HumeClient;
  private completedJobs: Map<string, VideoGenerationResult> = new Map();

  constructor(apiKey?: string) {
    console.log(
      `[HumeService] Constructor called with apiKey: ${apiKey ? "***PROVIDED***" : "undefined"}`,
    );

    if (!apiKey) {
      throw new Error(
        "Please configure your Hume API key in the dashboard or export HUME_API_KEY in your environment",
      );
    }

    this.client = new HumeClient({
      apiKey: apiKey,
    });
  }

  /**
   * Generate audio using Hume TTS (synchronous operation)
   * Note: Despite the method name, this generates audio, not video
   */
  async generateVideo(
    modelId: string,
    params: Record<string, unknown>,
  ): Promise<VideoGenerationResult> {
    console.log(`[HumeService] Generating audio with modelId: ${modelId}`);
    console.log(`[HumeService] Params:`, JSON.stringify(params, null, 2));

    try {
      // Prepare the TTS request
      const ttsRequest: any = {
        utterances: [
          {
            text: params.text as string,
            voice: params.voice ? { name: params.voice as string } : undefined,
            description: params.description as string | undefined,
            speed: params.speed as number | undefined,
            trailingSilence: params.trailingSilence as number | undefined,
          },
        ],
        format: params.format
          ? { type: params.format as string }
          : { type: "mp3" },
        version: params.version as string | undefined,
        numGenerations: params.numGenerations as number | undefined,
      };

      // Call Hume TTS API using synthesizeJson
      const ttsResult = await this.client.tts.synthesizeJson(ttsRequest);

      // Hume returns audio data in base64 - we need to handle the response format
      // The result includes generations with audio data
      let audioUrl: string;

      if (typeof ttsResult === "string") {
        audioUrl = ttsResult;
      } else if ((ttsResult as any).url) {
        audioUrl = (ttsResult as any).url;
      } else if ((ttsResult as any).audioUrl) {
        audioUrl = (ttsResult as any).audioUrl;
      } else if (
        (ttsResult as any).generations &&
        (ttsResult as any).generations.length > 0
      ) {
        // Hume returns base64 audio in generations array
        const generation = (ttsResult as any).generations[0];
        if (generation.audio) {
          // Return the base64 string as-is (job layer will upload to CDN)
          audioUrl = generation.audio;
        } else {
          throw new Error("No audio data in generation response");
        }
      } else {
        // If we get unexpected format, log and throw error
        console.error(
          `[HumeService] Unexpected result format:`,
          JSON.stringify(ttsResult, null, 2),
        );
        throw new Error("Unexpected Hume TTS response format - no audio found");
      }

      return { url: audioUrl };
    } catch (error) {
      console.error(`[HumeService] Failed to generate audio:`, error);

      // Extract clean error message from Hume SDK error
      if (error && typeof error === "object" && "body" in error) {
        const body = (error as any).body;
        if (body && typeof body === "object" && "error" in body) {
          // Check if it's a credentials/auth error
          if (
            body.error.toLowerCase().includes("credentials") ||
            (error as any).statusCode === 401
          ) {
            throw new Error(
              "Please configure your Hume API key in the dashboard or export HUME_API_KEY in your environment",
            );
          }
          throw new Error(body.error);
        }
      }

      // If error has a message property, use it
      if (error instanceof Error) {
        throw error;
      }

      // Fallback to generic error
      throw new Error("Hume TTS audio generation failed");
    }
  }

  /**
   * Start audio generation (synchronous - completes immediately)
   */
  async startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    _webhook?: string,
  ): Promise<AsyncGenerationStart> {
    console.log(
      `[HumeService] startGeneration called with modelId: ${modelId}`,
    );

    // Generate audio synchronously
    const audioResult = await this.generateVideo(modelId, params);

    const jobId = generateId();

    console.log(
      `[HumeService] Audio generated successfully with jobId: ${jobId}`,
    );

    // Store result for later retrieval
    this.completedJobs.set(jobId, audioResult);

    return {
      providerJobId: jobId,
      waitingStrategy: "polling", // Actually synchronous, but uses polling pattern
    };
  }

  /**
   * Get job status (always completed for Hume since it's synchronous)
   */
  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    console.log(`[HumeService] Getting job status for: ${providerJobId}`);

    const jobResult = this.completedJobs.get(providerJobId);

    if (!jobResult) {
      console.error(`[HumeService] Job not found: ${providerJobId}`);
      return {
        status: "failed",
        error: "Job not found",
      };
    }

    console.log(
      `[HumeService] Job completed:`,
      JSON.stringify(jobResult, null, 2),
    );

    return {
      status: "completed",
      result: jobResult,
    };
  }

  /**
   * Get raw job response (returns stored result)
   */
  async getRawJobResponse(providerJobId: string): Promise<unknown> {
    return this.completedJobs.get(providerJobId);
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities {
    return humeCapabilities;
  }
}
