import { z } from "zod";
import { replicateSchemas, type ReplicateModelId } from "./replicate.js";
import { falSchemas, type FalModelId } from "./fal.js";
import { googleCloudSchemas, type GoogleCloudModelId } from "./google-cloud.js";

export type VideoProvider = "replicate" | "fal" | "google-cloud";

export interface ModelRegistryEntry {
  provider: VideoProvider;
  schema: z.ZodType;
}

type AllModelIds = ReplicateModelId | FalModelId | GoogleCloudModelId;

export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    schema: replicateSchemas["bytedance/seedance-1-pro"],
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
