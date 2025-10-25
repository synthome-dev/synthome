import { z } from "zod";
import type { ParameterMapping } from "./unified.js";
import {
  seedanceModels,
  type SeedanceModelId,
  seedanceMapping,
  seedance1ProRawOptionsSchema,
  providerConfigSchema,
} from "./providers/replicate/index.js";

const seedance1ProOptionsSchema =
  seedance1ProRawOptionsSchema.merge(providerConfigSchema);

export const replicateSchemas = {
  ...seedanceModels,
} as const;

export type Seedance1ProOptions = z.infer<typeof seedance1ProOptionsSchema>;

export type ReplicateModelId = SeedanceModelId;

export interface ReplicateModels {
  "bytedance/seedance-1-pro": Seedance1ProOptions;
}

export const replicateMappings = {
  "bytedance/seedance-1-pro": seedanceMapping,
} as const;
