import { z } from "zod";
import type {
  PollingParser,
  ProviderCapabilities,
} from "../../webhook-types.js";

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

/**
 * Hume Provider Capabilities
 * Hume TTS is synchronous - returns audio immediately
 */
export const humeCapabilities: ProviderCapabilities = {
  supportsWebhooks: false,
  supportsPolling: false, // Actually synchronous
  defaultStrategy: "polling",
};

/**
 * Hume audio polling/webhook parser
 * Returns audio in outputs array format (consistent with image parsers)
 */
export const parseHumeAudio: PollingParser = (response: unknown) => {
  const data = response as any;

  // Hume TTS returns synchronously, so this should always be completed
  if (data.url) {
    return {
      status: "completed",
      outputs: [
        {
          type: "audio",
          url: data.url,
          mimeType: "audio/mpeg", // Hume typically returns MP3
        },
      ],
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

export const humeModelCapabilities = {
  "hume/tts": humeCapabilities,
} as const;
