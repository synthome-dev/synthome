import { z } from "zod";
import {
  falCapabilities,
  parseFalPolling,
  parseFalWebhook,
  parseFalImage,
  fabricModels,
  fabricMapping,
  nanobananaImageModels,
  nanobananaMapping,
  nanobananaProImageModels,
  nanobananaProMapping,
  nanobananaProEditImageModels,
  nanobananaProEditMapping,
  type FabricModelId,
  type NanobananaImageModelId,
  type NanobananaProImageModelId,
  type NanobananaProEditImageModelId,
  type Fabric1FastRawOptions,
  type NanobananaRawOptions,
  type NanobananaProRawOptions,
  type NanobananaProEditRawOptions,
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
  ...nanobananaImageModels,
  ...nanobananaProImageModels,
  ...nanobananaProEditImageModels,
} as const;

export type FalModelId =
  | FabricModelId
  | NanobananaImageModelId
  | NanobananaProImageModelId
  | NanobananaProEditImageModelId;

// Categorize models by media type for type-safe model creation
export type FalVideoModelId = FabricModelId; // Fabric is a video model
export type FalImageModelId =
  | NanobananaImageModelId
  | NanobananaProImageModelId
  | NanobananaProEditImageModelId; // Nanobanana models are image models
export type FalAudioModelId = never; // No FAL audio models yet

// Export options type for SDK
export type Fabric1FastOptions = z.infer<typeof fabric1FastOptionsSchema>;
export type NanobananaOptions = z.infer<
  (typeof nanobananaImageModels)["fal-ai/nano-banana"]
>;
export type NanobananaProOptions = z.infer<
  (typeof nanobananaProImageModels)["fal-ai/nano-banana-pro"]
>;
export type NanobananaProEditOptions = z.infer<
  (typeof nanobananaProEditImageModels)["fal-ai/nano-banana-pro/edit"]
>;

export interface FalModels {
  "veed/fabric-1.0": Fabric1FastOptions;
  "veed/fabric-1.0/fast": Fabric1FastOptions;
  "fal-ai/nano-banana": NanobananaOptions;
  "fal-ai/nano-banana-pro": NanobananaProOptions;
  "fal-ai/nano-banana-pro/edit": NanobananaProEditOptions;
}

export const falMappings = {
  "veed/fabric-1.0": fabricMapping,
  "veed/fabric-1.0/fast": fabricMapping,
  "fal-ai/nano-banana": nanobananaMapping,
  "fal-ai/nano-banana-pro": nanobananaProMapping,
  "fal-ai/nano-banana-pro/edit": nanobananaProEditMapping,
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
  "fal-ai/nano-banana": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
  "fal-ai/nano-banana-pro": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
  "fal-ai/nano-banana-pro/edit": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
};

export type {
  Fabric1FastRawOptions,
  NanobananaRawOptions,
  NanobananaProRawOptions,
  NanobananaProEditRawOptions,
};

export { falCapabilities, parseFalPolling, parseFalWebhook, parseFalImage };
