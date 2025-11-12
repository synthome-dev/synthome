import { z } from "zod";
import type {
  WebhookParser,
  PollingParser,
  ProviderCapabilities,
} from "../../webhook-types.js";

export const providerConfigSchema = z.object({
  projectId: z.string().optional(),
  apiKey: z.string().optional(),
});

/**
 * Google Cloud Provider Capabilities
 * Google Cloud Vertex AI does not support webhooks, only polling
 */
export const googleCloudCapabilities: ProviderCapabilities = {
  supportsWebhooks: false,
  supportsPolling: true,
  defaultStrategy: "polling",
};

/**
 * Example Google Cloud polling response:
 * {
 *   "name": "projects/123/locations/us-central1/operations/456",
 *   "done": true,
 *   "response": {
 *     "video": {
 *       "gcsUri": "gs://bucket/video.mp4"
 *     }
 *   }
 * }
 */

/**
 * Google Cloud does not support webhooks
 */
export const parseGoogleCloudWebhook: WebhookParser = () => {
  throw new Error("Google Cloud does not support webhooks");
};

/**
 * Google Cloud polling response parser
 */
export const parseGoogleCloudPolling: PollingParser = (response: unknown) => {
  const data = response as any;

  // Check if operation is done
  if (!data.done) {
    return {
      status: "processing",
    };
  }

  // Check for errors
  if (data.error) {
    return {
      status: "failed",
      error: data.error.message || "Generation failed",
    };
  }

  // Extract video URL from response
  const videoUri =
    data.response?.video?.gcsUri ||
    data.response?.videoUri ||
    data.response?.outputs?.[0]?.video;

  if (!videoUri) {
    return {
      status: "failed",
      error: "No video output in completed response",
    };
  }

  return {
    status: "completed",
    outputs: [
      {
        type: "video",
        url: videoUri,
        mimeType: "video/mp4",
      },
    ],
    metadata: {
      operationName: data.name,
    },
  };
};
