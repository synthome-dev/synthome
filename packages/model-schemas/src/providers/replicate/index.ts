import { z } from "zod";
import type {
  PollingParser,
  ProviderCapabilities,
  WebhookParser,
} from "../../webhook-types.js";

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

/**
 * Replicate Provider Capabilities
 * Replicate supports webhooks natively
 */
export const replicateCapabilities: ProviderCapabilities = {
  supportsWebhooks: true,
  supportsPolling: true,
  defaultStrategy: "webhook",
};

/**
 * Example Replicate webhook payload:
 * {
 *   "id": "abc123",
 *   "status": "succeeded",
 *   "output": "https://replicate.delivery/pbxt/xyz.mp4"
 * }
 * Or for array output:
 * {
 *   "status": "succeeded",
 *   "output": ["https://replicate.delivery/pbxt/xyz.mp4"]
 * }
 */

/**
 * Generic Replicate webhook parser
 */
export const parseReplicateWebhook: WebhookParser = (payload: unknown) => {
  const data = payload as any;

  if (data.status === "failed" || data.status === "canceled") {
    return {
      status: "failed",
      error: data.error || "Generation failed",
    };
  }

  if (
    data.status === "starting" ||
    data.status === "processing" ||
    data.status === "queued"
  ) {
    return {
      status: "processing",
    };
  }

  if (data.status === "succeeded") {
    // Handle both string and array outputs
    let videoUrl: string | undefined;

    if (typeof data.output === "string") {
      videoUrl = data.output;
    } else if (Array.isArray(data.output) && data.output.length > 0) {
      videoUrl = data.output[0];
    }

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
      metadata: {
        predictionId: data.id,
      },
    };
  }

  return {
    status: "processing",
  };
};

/**
 * Replicate polling response parser
 * Same structure as webhook
 */
export const parseReplicatePolling: PollingParser = parseReplicateWebhook;

export * from "./seedance/index.js";
