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
 * Using polling as default since webhooks require publicly accessible URLs
 */
export const falCapabilities: ProviderCapabilities = {
  supportsWebhooks: true,
  supportsPolling: true,
  defaultStrategy: "polling",
};

// Export Fabric model
export * from "./fabric/index.js";

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
 * Parses the response from fal.queue.status() OR fal.queue.result()
 *
 * NOTE: FAL's queue.status() only returns metadata when COMPLETED
 * We must call queue.result() to get the actual output (video URL)
 */
export const parseFalPolling: PollingParser = (response: unknown) => {
  const data = response as any;

  // Extract the actual response data
  const queueData = data?.result || data;

  console.log(
    "[parseFalPolling] Parsing response:",
    JSON.stringify(queueData, null, 2),
  );

  // Check if this is a status response (has status field) or a result response (has video field)
  const isStatusResponse = "status" in queueData;
  const isResultResponse = "video" in queueData;

  console.log("[parseFalPolling] Response type:", {
    isStatusResponse,
    isResultResponse,
  });

  // Handle result response (from fal.queue.result() - this is the completed job output)
  if (isResultResponse) {
    console.log(
      "[parseFalPolling] This is a result response with video output",
    );

    const videoUrl = queueData.video?.url || queueData.video;

    if (!videoUrl) {
      console.error("[parseFalPolling] ❌ No video URL in result response");
      return {
        status: "failed",
        error: "No video URL in result response",
      };
    }

    console.log(
      "[parseFalPolling] ✅ Successfully extracted video URL:",
      videoUrl,
    );

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

  // Handle status response (from fal.queue.status() - job state)
  if (isStatusResponse) {
    const status = queueData.status;
    console.log("[parseFalPolling] Status:", status);

    if (status === "FAILED") {
      return {
        status: "failed",
        error: queueData.error || "Generation failed",
      };
    }

    if (status === "IN_PROGRESS" || status === "IN_QUEUE") {
      return {
        status: "processing",
      };
    }

    // This shouldn't happen as we fetch result when status is COMPLETED
    // But handle it just in case
    if (status === "COMPLETED") {
      console.warn(
        "[parseFalPolling] Got COMPLETED status but no result data - this shouldn't happen",
      );
      return {
        status: "processing", // Will retry
      };
    }
  }

  // Unknown response format
  console.log(
    "[parseFalPolling] Unknown response format, defaulting to processing",
  );
  return {
    status: "processing",
  };
};
