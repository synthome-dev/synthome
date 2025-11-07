import { z } from "zod";
import {
  type FalModelId,
  falModelCapabilities,
  parseFalPolling,
  parseFalWebhook,
  falSchemas,
} from "./fal.js";
import { type GoogleCloudModelId } from "./google-cloud.js";
import {
  parseReplicateAudio,
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  replicateModelCapabilities,
  replicateSchemas,
  type ReplicateModelId,
} from "./replicate.js";
import type {
  MediaType,
  PollingParser,
  ProviderCapabilities,
  WebhookParser,
} from "./webhook-types.js";

export type VideoProvider = "replicate" | "fal" | "google-cloud";

export interface ModelRegistryEntry {
  provider: VideoProvider;
  mediaType: MediaType;
  schema: z.ZodType;
  webhookParser: WebhookParser;
  pollingParser: PollingParser;
  capabilities: ProviderCapabilities;
  providerModelId?: string; // Optional: full model version/identifier for the provider (e.g., Replicate version hash)
}

type AllModelIds = ReplicateModelId | FalModelId | GoogleCloudModelId;

export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["bytedance/seedance-1-pro"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["bytedance/seedance-1-pro"],
  },
  "minimax/video-01": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["minimax/video-01"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["minimax/video-01"],
  },
  "bytedance/seedream-4": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["bytedance/seedream-4"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["bytedance/seedream-4"],
  },
  "elevenlabs/turbo-v2.5": {
    provider: "replicate",
    mediaType: "audio",
    schema: replicateSchemas["elevenlabs/turbo-v2.5"],
    webhookParser: parseReplicateAudio,
    pollingParser: parseReplicateAudio,
    capabilities: replicateModelCapabilities["elevenlabs/turbo-v2.5"],
  },
  "arielreplicate/robust_video_matting": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["arielreplicate/robust_video_matting"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities:
      replicateModelCapabilities["arielreplicate/robust_video_matting"],
    providerModelId:
      "73d2128a371922d5d1abf0712a1d974be0e4e2358cc1218e4e34714767232bac",
  },
  "nateraw/video-background-remover": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["nateraw/video-background-remover"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities:
      replicateModelCapabilities["nateraw/video-background-remover"],
    providerModelId:
      "ac5c138171b04413a69222c304f67c135e259d46089fc70ef12da685b3c604aa",
  },
  "veed/fabric-1.0": {
    provider: "fal",
    mediaType: "video",
    schema: falSchemas["veed/fabric-1.0"],
    webhookParser: parseFalWebhook,
    pollingParser: parseFalPolling,
    capabilities: falModelCapabilities["veed/fabric-1.0"],
  },
  "veed/fabric-1.0/fast": {
    provider: "fal",
    mediaType: "video",
    schema: falSchemas["veed/fabric-1.0/fast"],
    webhookParser: parseFalWebhook,
    pollingParser: parseFalPolling,
    capabilities: falModelCapabilities["veed/fabric-1.0/fast"],
  },
  "codeplugtech/background_remover": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["codeplugtech/background_remover"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["codeplugtech/background_remover"],
  },
};

export function getModelInfo(modelId: string): ModelRegistryEntry | undefined {
  return modelRegistry[modelId as AllModelIds];
}

export function validateModelOptions(
  modelId: string,
  options: unknown,
): boolean {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const result = modelInfo.schema.safeParse(options);
  return result.success;
}

export function parseModelOptions<T>(modelId: string, options: unknown): T {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.schema.parse(options) as T;
}

/**
 * Parse a webhook payload for a specific model
 */
export function parseModelWebhook(modelId: string, payload: unknown) {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.webhookParser(payload);
}

/**
 * Parse a polling response for a specific model
 */
export function parseModelPolling(modelId: string, response: unknown) {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.pollingParser(response);
}

/**
 * Get provider capabilities for a model
 */
export function getModelCapabilities(modelId: string): ProviderCapabilities {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.capabilities;
}

/**
 * Get the media type (video/audio/image) for a model
 */
export function getModelMediaType(modelId: string): MediaType | undefined {
  const modelInfo = getModelInfo(modelId);
  return modelInfo?.mediaType;
}
