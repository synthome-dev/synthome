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

/**
 * Replicate image polling/webhook parser
 * Handles array of image URLs as output
 */
export const parseReplicateImage: PollingParser = (response: unknown) => {
  const data = response as any;

  if (data.status === "failed" || data.status === "canceled") {
    return {
      status: "failed",
      error: data.error || "Image generation failed",
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
    // Handle array of image URLs (e.g., Seedream-4)
    if (Array.isArray(data.output) && data.output.length > 0) {
      return {
        status: "completed",
        outputs: data.output.map((url: string) => ({
          type: "image",
          url,
          mimeType: "image/jpeg",
        })),
        metadata: {
          predictionId: data.id,
        },
      };
    }

    // Handle single image URL string (e.g., Nanobanana, background removers)
    if (typeof data.output === "string" && data.output) {
      return {
        status: "completed",
        outputs: [
          {
            type: "image",
            url: data.output,
            mimeType: "image/jpeg",
          },
        ],
        metadata: {
          predictionId: data.id,
        },
      };
    }

    return {
      status: "failed",
      error: "No image output in completed response",
    };
  }

  return {
    status: "processing",
  };
};

/**
 * Replicate audio polling/webhook parser
 * Handles single audio URL as output (MP3 file)
 */
export const parseReplicateAudio: PollingParser = (response: unknown) => {
  const data = response as any;

  if (data.status === "failed" || data.status === "canceled") {
    return {
      status: "failed",
      error: data.error || "Audio generation failed",
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
    // ElevenLabs returns a single audio URL string
    if (typeof data.output === "string" && data.output) {
      return {
        status: "completed",
        outputs: [
          {
            type: "audio",
            url: data.output,
            mimeType: "audio/mpeg",
          },
        ],
        metadata: {
          predictionId: data.id,
        },
      };
    }

    return {
      status: "failed",
      error: "No audio output in completed response",
    };
  }

  return {
    status: "processing",
  };
};

export * from "./elevenlabs/index.js";
export * from "./image-background-remover/index.js";
export * from "./minimax/index.js";
export * from "./nanobanana/index.js";
export * from "./seedance/index.js";
export * from "./seedream/index.js";
export * from "./video-background-remover/index.js";
export * from "./video-matting/index.js";
