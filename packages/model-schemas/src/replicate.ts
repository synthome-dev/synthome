import { z } from "zod";
import {
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  providerConfigSchema,
  replicateCapabilities,
  seedance1ProRawOptionsSchema,
  seedanceMapping,
  seedanceModels,
  seedream4OptionsSchema,
  seedreamImageModels,
  type SeedanceModelId,
  type SeedreamImageModelId,
} from "./providers/replicate/index.js";
import {
  minimaxMapping,
  minimaxModels,
  type MinimaxModelId,
} from "./providers/replicate/minimax/index.js";
import type { ProviderCapabilities } from "./webhook-types.js";

const seedance1ProOptionsSchema =
  seedance1ProRawOptionsSchema.merge(providerConfigSchema);

export const replicateSchemas = {
  ...seedanceModels,
  ...minimaxModels,
  ...seedreamImageModels,
} as const;

export type Seedance1ProOptions = z.infer<typeof seedance1ProOptionsSchema>;
export type Seedream4Options = z.infer<typeof seedream4OptionsSchema>;

export type ReplicateModelId =
  | SeedanceModelId
  | MinimaxModelId
  | SeedreamImageModelId;

export interface ReplicateModels {
  "bytedance/seedance-1-pro": Seedance1ProOptions;
  "minimax/video-01": z.infer<(typeof minimaxModels)["minimax/video-01"]>;
  "bytedance/seedream-4": Seedream4Options;
}

export const replicateMappings = {
  "bytedance/seedance-1-pro": seedanceMapping,
  "minimax/video-01": minimaxMapping,
} as const;

// Model-specific capabilities
export const replicateModelCapabilities: Record<
  ReplicateModelId,
  ProviderCapabilities
> = {
  "bytedance/seedance-1-pro": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "webhook",
  },
  "minimax/video-01": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "webhook",
  },
  "bytedance/seedream-4": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
};

export {
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  replicateCapabilities,
};
