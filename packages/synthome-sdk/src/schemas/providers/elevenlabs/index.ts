import { z } from "zod";
import type {
  PollingParser,
  ProviderCapabilities,
} from "../../webhook-types.js";

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

/**
 * ElevenLabs Provider Capabilities
 * ElevenLabs TTS is synchronous - returns audio immediately
 */
export const elevenLabsCapabilities: ProviderCapabilities = {
  supportsWebhooks: false,
  supportsPolling: false, // Actually synchronous
  defaultStrategy: "polling",
};

/**
 * ElevenLabs audio polling/webhook parser
 * Handles audio data output (MP3/PCM buffer)
 */
export const parseElevenLabsAudio: PollingParser = (response: unknown) => {
  const data = response as any;

  // ElevenLabs TTS returns synchronously, so this should always be completed
  if (data.url) {
    return {
      status: "completed",
      outputs: [
        {
          type: "audio",
          url: data.url,
          mimeType: data.mimeType || "audio/mpeg",
        },
      ],
      metadata: {
        voiceId: data.voiceId,
        modelId: data.modelId,
      },
    };
  }

  // Handle error case
  if (data.error) {
    return {
      status: "failed",
      error: data.error || "Audio generation failed",
    };
  }

  // Should not reach here in normal operation
  return {
    status: "processing",
  };
};

export * from "./schema.js";

export const elevenLabsModelCapabilities = {
  "elevenlabs/turbo-v2.5": elevenLabsCapabilities,
} as const;
