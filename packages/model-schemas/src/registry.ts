import { z } from "zod";
import { type FalModelId } from "./fal.js";
import { type GoogleCloudModelId } from "./google-cloud.js";
import {
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  replicateModelCapabilities,
  replicateSchemas,
  type ReplicateModelId,
} from "./replicate.js";
import type {
  PollingParser,
  ProviderCapabilities,
  WebhookParser,
} from "./webhook-types.js";

export type VideoProvider = "replicate" | "fal" | "google-cloud";

export interface ModelRegistryEntry {
  provider: VideoProvider;
  schema: z.ZodType;
  webhookParser: WebhookParser;
  pollingParser: PollingParser;
  capabilities: ProviderCapabilities;
}

type AllModelIds = ReplicateModelId | FalModelId | GoogleCloudModelId;

export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    schema: replicateSchemas["bytedance/seedance-1-pro"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["bytedance/seedance-1-pro"],
  },
  "minimax/video-01": {
    provider: "replicate",
    schema: replicateSchemas["minimax/video-01"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["minimax/video-01"],
  },
  "bytedance/seedream-4": {
    provider: "replicate",
    schema: replicateSchemas["bytedance/seedream-4"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["bytedance/seedream-4"],
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
