import { z } from "zod";
import {
  parseReplicateAudio,
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
  seedreamMapping,
  elevenLabsAudioModels,
  videoMattingModels,
  videoMattingMapping,
  videoBackgroundRemoverModels,
  naterawVideoBackgroundRemoverMapping,
  imageBackgroundRemoverModels,
  nanobananaImageModels,
  nanobananaMapping,
  type SeedanceModelId,
  type SeedreamImageModelId,
  type NanobananaImageModelId,
  type ElevenLabsAudioModelId,
  type VideoMattingModelId,
  type VideoBackgroundRemoverModelId,
  type ImageBackgroundRemoverModelId,
  type RobustVideoMattingRawOptions,
  type NaterawVideoBackgroundRemoverRawOptions,
  type NanobananaRawOptions,
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
  ...nanobananaImageModels,
  ...elevenLabsAudioModels,
  ...videoMattingModels,
  ...videoBackgroundRemoverModels,
  ...imageBackgroundRemoverModels,
} as const;

export type Seedance1ProOptions = z.infer<typeof seedance1ProOptionsSchema>;
export type Seedream4Options = z.infer<typeof seedream4OptionsSchema>;
export type ElevenLabsTurboV25Options = z.infer<
  (typeof elevenLabsAudioModels)["elevenlabs/turbo-v2.5"]
>;
export type {
  RobustVideoMattingRawOptions,
  NaterawVideoBackgroundRemoverRawOptions,
  NanobananaRawOptions,
};

export type ReplicateModelId =
  | SeedanceModelId
  | MinimaxModelId
  | SeedreamImageModelId
  | NanobananaImageModelId
  | ElevenLabsAudioModelId
  | VideoMattingModelId
  | VideoBackgroundRemoverModelId
  | ImageBackgroundRemoverModelId;

// Categorize models by media type for type-safe model creation
export type ReplicateVideoModelId = SeedanceModelId | MinimaxModelId;
export type ReplicateImageModelId =
  | SeedreamImageModelId
  | NanobananaImageModelId
  | ImageBackgroundRemoverModelId;
export type ReplicateAudioModelId = ElevenLabsAudioModelId;

export interface ReplicateModels {
  "bytedance/seedance-1-pro": Seedance1ProOptions;
  "minimax/video-01": z.infer<(typeof minimaxModels)["minimax/video-01"]>;
  "bytedance/seedream-4": Seedream4Options;
  "google/nano-banana": z.infer<
    (typeof nanobananaImageModels)["google/nano-banana"]
  >;
  "elevenlabs/turbo-v2.5": ElevenLabsTurboV25Options;
  "arielreplicate/robust_video_matting": z.infer<
    (typeof videoMattingModels)["arielreplicate/robust_video_matting"]
  >;
  "nateraw/video-background-remover": z.infer<
    (typeof videoBackgroundRemoverModels)["nateraw/video-background-remover"]
  >;
  "codeplugtech/background_remover": z.infer<
    (typeof imageBackgroundRemoverModels)["codeplugtech/background_remover"]
  >;
}

export const replicateMappings = {
  "bytedance/seedance-1-pro": seedanceMapping,
  "minimax/video-01": minimaxMapping,
  "bytedance/seedream-4": seedreamMapping,
  "google/nano-banana": nanobananaMapping,
  "arielreplicate/robust_video_matting": videoMattingMapping,
  "nateraw/video-background-remover": naterawVideoBackgroundRemoverMapping,
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
  "google/nano-banana": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
  "elevenlabs/turbo-v2.5": {
    supportsWebhooks: false, // Audio is very fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
  "arielreplicate/robust_video_matting": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "webhook",
  },
  "nateraw/video-background-remover": {
    supportsWebhooks: true,
    supportsPolling: true,
    defaultStrategy: "webhook",
  },
  "codeplugtech/background_remover": {
    supportsWebhooks: false, // Images are fast, use polling
    supportsPolling: true,
    defaultStrategy: "polling",
  },
};

export {
  parseReplicateAudio,
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  replicateCapabilities,
};
