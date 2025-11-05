import { z } from "zod";
import {
  parseReplicatePolling,
  parseReplicateWebhook,
  providerConfigSchema,
  replicateCapabilities,
  seedance1ProRawOptionsSchema,
  seedanceMapping,
  seedanceModels,
  type SeedanceModelId,
} from "./providers/replicate/index.js";
import {
  minimaxMapping,
  minimaxModels,
  type MinimaxModelId,
} from "./providers/replicate/minimax/index.js";

const seedance1ProOptionsSchema =
  seedance1ProRawOptionsSchema.merge(providerConfigSchema);

export const replicateSchemas = {
  ...seedanceModels,
  ...minimaxModels,
} as const;

export type Seedance1ProOptions = z.infer<typeof seedance1ProOptionsSchema>;

export type ReplicateModelId = SeedanceModelId | MinimaxModelId;

export interface ReplicateModels {
  "bytedance/seedance-1-pro": Seedance1ProOptions;
  "minimax/video-01": z.infer<(typeof minimaxModels)["minimax/video-01"]>;
}

export const replicateMappings = {
  "bytedance/seedance-1-pro": seedanceMapping,
  "minimax/video-01": minimaxMapping,
} as const;

export { parseReplicatePolling, parseReplicateWebhook, replicateCapabilities };
