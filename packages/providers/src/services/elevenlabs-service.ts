import type { ProviderCapabilities } from "@repo/model-schemas";
import { elevenLabsCapabilities } from "@repo/model-schemas";
import { generateId } from "@repo/tools";
import { ElevenLabsClient } from "elevenlabs";
import type {
  AsyncGenerationStart,
  AsyncJobStatus,
  VideoGenerationResult,
  VideoProviderService,
} from "./base-provider.js";

export class ElevenLabsService implements VideoProviderService {
  private client: ElevenLabsClient;
  private completedJobs: Map<string, VideoGenerationResult> = new Map();

  constructor(apiKey?: string) {
    console.log(
      `[ElevenLabsService] Constructor called with apiKey: ${apiKey ? "***PROVIDED***" : "undefined"}`,
      apiKey
    );

    if (!apiKey) {
      throw new Error(
        "Please configure your ElevenLabs API key in the dashboard or export ELEVENLABS_API_KEY in your environment"
      );
    }

    this.client = new ElevenLabsClient({
      apiKey: apiKey,
    });
  }

  /**
   * Generate audio using ElevenLabs TTS (synchronous operation)
   * Note: Despite the method name, this generates audio, not video
   */
  async generateVideo(
    modelId: string,
    params: Record<string, unknown>
  ): Promise<VideoGenerationResult> {
    console.log(
      `[ElevenLabsService] Generating audio with modelId: ${modelId}`
    );
    console.log(`[ElevenLabsService] Params:`, JSON.stringify(params, null, 2));

    try {
      // Extract and validate required parameters
      const text = params.text as string;
      const voiceId = params.voiceId as string;

      if (!text) {
        throw new Error("Missing required parameter: text");
      }
      if (!voiceId) {
        throw new Error("Missing required parameter: voiceId");
      }

      // Map camelCase parameters to snake_case for ElevenLabs API
      const voiceSettings: any = {};
      if (params.stability !== undefined) {
        voiceSettings.stability = params.stability;
      }
      if (params.similarityBoost !== undefined) {
        voiceSettings.similarity_boost = params.similarityBoost;
      }
      if (params.style !== undefined) {
        voiceSettings.style = params.style;
      }
      if (params.useSpeakerBoost !== undefined) {
        voiceSettings.use_speaker_boost = params.useSpeakerBoost;
      }

      // Prepare TTS request options
      const ttsOptions: any = {
        text,
        voice: voiceId,
        model_id: (params.modelId as string) || "eleven_turbo_v2_5",
      };

      // Add voice settings if provided
      if (Object.keys(voiceSettings).length > 0) {
        ttsOptions.voice_settings = voiceSettings;
      }

      // Add optional parameters
      if (params.outputFormat) {
        ttsOptions.output_format = params.outputFormat;
      }
      if (params.languageCode) {
        ttsOptions.language_code = params.languageCode;
      }
      if (params.previousText) {
        ttsOptions.previous_text = params.previousText;
      }
      if (params.nextText) {
        ttsOptions.next_text = params.nextText;
      }

      console.log(
        `[ElevenLabsService] TTS request:`,
        JSON.stringify(ttsOptions, null, 2)
      );

      // Call ElevenLabs TTS API - returns audio stream
      const audioStream = await this.client.textToSpeech.convert(
        voiceId,
        ttsOptions
      );

      console.log(
        `[ElevenLabsService] Audio stream received, converting to base64`
      );

      // Convert audio stream to buffer, then to base64 data URL
      const chunks: Uint8Array[] = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }

      // Concatenate all chunks into a single buffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const audioBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64 and return as-is (job layer will upload to CDN)
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      console.log(
        `[ElevenLabsService] Audio generated successfully, size: ${base64Audio.length} bytes`
      );

      return { url: base64Audio };
    } catch (error) {
      console.error(`[ElevenLabsService] Failed to generate audio:`, error);

      // Check if it's an authentication/API key error
      if (error && typeof error === "object") {
        const errorMessage = (error as any).message || "";
        const statusCode = (error as any).statusCode || (error as any).status;

        // Check for 401 Unauthorized or authentication-related errors
        if (
          statusCode === 401 ||
          errorMessage.toLowerCase().includes("unauthorized") ||
          errorMessage.toLowerCase().includes("api key") ||
          errorMessage.toLowerCase().includes("authentication")
        ) {
          throw new Error(
            "Please configure your ElevenLabs API key in the dashboard or export ELEVENLABS_API_KEY in your environment"
          );
        }
      }

      throw error;
    }
  }

  /**
   * Start audio generation (synchronous - completes immediately)
   */
  async startGeneration(
    modelId: string,
    params: Record<string, unknown>,
    _webhook?: string
  ): Promise<AsyncGenerationStart> {
    console.log(
      `[ElevenLabsService] startGeneration called with modelId: ${modelId}`
    );

    // Generate audio synchronously
    const audioResult = await this.generateVideo(modelId, params);

    // Use generateId from @repo/tools (NOT crypto.randomUUID!)
    const jobId = generateId();

    console.log(
      `[ElevenLabsService] Audio generated successfully with jobId: ${jobId}`
    );

    // Store result for later retrieval
    this.completedJobs.set(jobId, audioResult);

    return {
      providerJobId: jobId,
      waitingStrategy: "polling", // Actually synchronous, but uses polling pattern
    };
  }

  /**
   * Get job status (always completed for ElevenLabs since it's synchronous)
   */
  async getJobStatus(providerJobId: string): Promise<AsyncJobStatus> {
    console.log(`[ElevenLabsService] Getting job status for: ${providerJobId}`);

    const jobResult = this.completedJobs.get(providerJobId);

    if (!jobResult) {
      console.error(`[ElevenLabsService] Job not found: ${providerJobId}`);
      return {
        status: "failed",
        error: "Job not found",
      };
    }

    console.log(`[ElevenLabsService] Job completed:`);

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
    return elevenLabsCapabilities;
  }
}
