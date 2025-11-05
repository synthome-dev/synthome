import { z } from "zod";
import type {
  WebhookParser,
  PollingParser,
  ProviderCapabilities,
} from "../../webhook-types.js";

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

/**
 * FAL Provider Capabilities
 * FAL supports webhooks natively
 */
export const falCapabilities: ProviderCapabilities = {
  supportsWebhooks: true,
  supportsPolling: true,
  defaultStrategy: "webhook",
};

/**
 * Example FAL webhook payload:
 * {
 *   "status": "COMPLETED",
 *   "outputs": [{
 *     "video": "https://fal.media/files/xyz.mp4"
 *   }]
 * }
 */

/**
 * Generic FAL webhook parser
 * Can be customized per model if needed
 */
export const parseFalWebhook: WebhookParser = (payload: unknown) => {
  const data = payload as any;

  if (data.status === "FAILED") {
    return {
      status: "failed",
      error: data.error || "Generation failed",
    };
  }

  if (data.status === "IN_PROGRESS" || data.status === "IN_QUEUE") {
    return {
      status: "processing",
    };
  }

  if (data.status === "COMPLETED") {
    // Extract video URL from outputs
    const outputs = data.outputs || data.output;
    const videoUrl = outputs?.video || outputs?.[0]?.video;

    if (!videoUrl) {
      return {
        status: "failed",
        error: "No video output in completed webhook",
      };
    }

    return {
      status: "completed",
      outputs: [
        {
          type: "video",
          url: videoUrl,
          mimeType: "video/mp4",
        },
      ],
    };
  }

  return {
    status: "processing",
  };
};

/**
 * FAL polling response parser
 * Same structure as webhook in most cases
 */
export const parseFalPolling: PollingParser = parseFalWebhook;
