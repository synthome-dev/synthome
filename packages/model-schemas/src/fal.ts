import { z } from "zod";
import {
  falCapabilities,
  parseFalPolling,
  parseFalWebhook,
  fabricModels,
  fabricMapping,
  type FabricModelId,
  type Fabric1FastRawOptions,
  providerConfigSchema,
} from "./providers/fal/index.js";
import type { ProviderCapabilities } from "./webhook-types.js";

// Merge raw options with provider config to extend ProviderConfig
const fabric1FastOptionsSchema = z
  .object({
    image: z.string().url().optional(),
    audio: z.string().url().optional(),
    image_url: z.string().url().optional(),
    audio_url: z.string().url().optional(),
    resolution: z.enum(["720p", "480p"]),
  })
  .merge(providerConfigSchema)
  .refine((data) => data.image || data.image_url, {
    message: "Either 'image' or 'image_url' is required",
  })
  .refine((data) => data.audio || data.audio_url, {
    message: "Either 'audio' or 'audio_url' is required",
  });

export const falSchemas = {
  "veed/fabric-1.0": fabric1FastOptionsSchema,
  "veed/fabric-1.0/fast": fabric1FastOptionsSchema,
} as const;

export type FalModelId = FabricModelId;

// Categorize models by media type for type-safe model creation
export type FalVideoModelId = FabricModelId; // Fabric is a video model
export type FalImageModelId = never; // No FAL image models yet
export type FalAudioModelId = never; // No FAL audio models yet

// Export options type for SDK
export type Fabric1FastOptions = z.infer<typeof fabric1FastOptionsSchema>;

export interface FalModels {
  "veed/fabric-1.0": Fabric1FastOptions;
  "veed/fabric-1.0/fast": Fabric1FastOptions;
}

export const falMappings = {
  "veed/fabric-1.0": fabricMapping,
  "veed/fabric-1.0/fast": fabricMapping,
} as const;

// Model-specific capabilities
export const falModelCapabilities: Record<FalModelId, ProviderCapabilities> = {
  "veed/fabric-1.0": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "polling",
  },
  "veed/fabric-1.0/fast": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "polling",
  },
};

export { falCapabilities, parseFalPolling, parseFalWebhook };
