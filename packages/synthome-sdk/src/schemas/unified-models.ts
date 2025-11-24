/**
 * Unified Model Registry
 *
 * This file defines unified model names that work across providers.
 * Users can reference models by their canonical name (e.g., "google/nano-banana")
 * and the SDK will automatically map to the correct provider-specific model ID.
 *
 * Benefits:
 * - Consistent naming across providers
 * - Easy provider switching
 * - Simplified API for users
 */

import type { VideoProvider } from "./registry.js";

/**
 * Maps a unified model name to provider-specific model IDs
 */
export interface UnifiedModelMapping {
  /**
   * The canonical/unified model name (e.g., "google/nano-banana")
   */
  unifiedName: string;

  /**
   * Display name for documentation
   */
  displayName: string;

  /**
   * Model creator/organization
   */
  creator: string;

  /**
   * Media type produced by this model
   */
  mediaType: "video" | "image" | "audio";

  /**
   * Map of provider to their specific model ID
   */
  providers: Partial<Record<VideoProvider, string>>;

  /**
   * Optional: Additional metadata
   */
  metadata?: {
    description?: string;
    tags?: string[];
    deprecated?: boolean;
  };
}

/**
 * Registry of unified model mappings
 * Note: We intentionally don't type this with UnifiedModelMapping to preserve
 * exact provider inference for TypeScript autocomplete
 */
export const unifiedModelRegistry = {
  // Google Gemini 2.5 Flash Image (Nano Banana)
  "google/nano-banana": {
    unifiedName: "google/nano-banana",
    displayName: "Gemini 2.5 Flash Image (Nano Banana)",
    creator: "google",
    mediaType: "image" as const,
    providers: {
      replicate: "google/nano-banana",
      fal: "fal-ai/nano-banana",
    },
    metadata: {
      description: "Fast, high-quality image generation from Google",
      tags: ["image-generation", "text-to-image", "image-to-image", "fast"],
    },
  },

  // Google Gemini 3 Pro Image (Nano Banana Pro)
  "google/nano-banana-pro": {
    unifiedName: "google/nano-banana-pro",
    displayName: "Gemini 3 Pro Image (Nano Banana Pro)",
    creator: "google",
    mediaType: "image" as const,
    providers: {
      replicate: "google/nano-banana-pro",
      fal: "fal-ai/nano-banana-pro",
    },
    metadata: {
      description:
        "Advanced image generation and editing with Gemini 3 Pro, featuring accurate text rendering and advanced reasoning",
      tags: [
        "image-generation",
        "text-to-image",
        "image-to-image",
        "advanced",
        "typography",
        "high-resolution",
      ],
    },
  },

  // ByteDance Seedance (Video)
  "bytedance/seedance-1-pro": {
    unifiedName: "bytedance/seedance-1-pro",
    displayName: "Seedance 1 Pro",
    creator: "bytedance",
    mediaType: "video" as const,
    providers: {
      replicate: "bytedance/seedance-1-pro",
    },
    metadata: {
      description: "High-quality video generation",
      tags: ["video-generation", "text-to-video"],
    },
  },

  // ByteDance Seedream (Image)
  "bytedance/seedream-4": {
    unifiedName: "bytedance/seedream-4",
    displayName: "Seedream 4",
    creator: "bytedance",
    mediaType: "image" as const,
    providers: {
      replicate: "bytedance/seedream-4",
    },
    metadata: {
      description: "High-quality image generation with flexible sizing",
      tags: ["image-generation", "text-to-image", "high-resolution"],
    },
  },

  // CodePlug Tech Background Remover (Image)
  "codeplugtech/background_remover": {
    unifiedName: "codeplugtech/background_remover",
    displayName: "Background Remover",
    creator: "codeplugtech",
    mediaType: "image" as const,
    providers: {
      replicate: "codeplugtech/background_remover",
    },
    metadata: {
      description: "Remove backgrounds from images",
      tags: ["image-transformation", "image-to-image", "background-removal"],
    },
  },

  // Minimax Video
  "minimax/video-01": {
    unifiedName: "minimax/video-01",
    displayName: "Minimax Video 01",
    creator: "minimax",
    mediaType: "video" as const,
    providers: {
      replicate: "minimax/video-01",
    },
    metadata: {
      description: "Video generation model",
      tags: ["video-generation", "text-to-video"],
    },
  },

  // VEED Fabric (Lip Sync)
  "veed/fabric-1.0": {
    unifiedName: "veed/fabric-1.0",
    displayName: "Fabric 1.0",
    creator: "veed",
    mediaType: "video" as const,
    providers: {
      fal: "veed/fabric-1.0",
    },
    metadata: {
      description: "Image-to-video lip sync",
      tags: ["lip-sync", "image-to-video", "talking-head"],
    },
  },

  "veed/fabric-1.0/fast": {
    unifiedName: "veed/fabric-1.0/fast",
    displayName: "Fabric 1.0 Fast",
    creator: "veed",
    mediaType: "video" as const,
    providers: {
      fal: "veed/fabric-1.0/fast",
    },
    metadata: {
      description: "Fast image-to-video lip sync",
      tags: ["lip-sync", "image-to-video", "talking-head", "fast"],
    },
  },

  // ElevenLabs TTS
  "elevenlabs/turbo-v2.5": {
    unifiedName: "elevenlabs/turbo-v2.5",
    displayName: "ElevenLabs Turbo v2.5",
    creator: "elevenlabs",
    mediaType: "audio" as const,
    providers: {
      elevenlabs: "elevenlabs/turbo-v2.5",
      replicate: "elevenlabs/turbo-v2.5",
    },
    metadata: {
      description: "Fast, high-quality text-to-speech",
      tags: ["text-to-speech", "audio-generation", "voice"],
    },
  },

  // Hume TTS
  "hume/tts": {
    unifiedName: "hume/tts",
    displayName: "Hume TTS",
    creator: "hume",
    mediaType: "audio" as const,
    providers: {
      hume: "hume/tts",
    },
    metadata: {
      description: "Emotionally expressive text-to-speech",
      tags: ["text-to-speech", "audio-generation", "voice", "emotional"],
    },
  },

  // OpenAI Whisper (Speech-to-Text)
  "openai/whisper": {
    unifiedName: "openai/whisper",
    displayName: "OpenAI Whisper",
    creator: "openai",
    mediaType: "audio" as const,
    providers: {
      replicate:
        "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
    },
    metadata: {
      description:
        "Speech-to-text transcription with sentence-level timestamps",
      tags: ["speech-to-text", "transcription", "audio-processing"],
    },
  },

  // Incredibly Fast Whisper (Speech-to-Text with Word Timestamps)
  "vaibhavs10/incredibly-fast-whisper": {
    unifiedName: "vaibhavs10/incredibly-fast-whisper",
    displayName: "Incredibly Fast Whisper",
    creator: "vaibhavs10",
    mediaType: "audio" as const,
    providers: {
      replicate:
        "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
    },
    metadata: {
      description:
        "Optimized Whisper with word-level timestamps for caption generation",
      tags: [
        "speech-to-text",
        "transcription",
        "audio-processing",
        "word-timestamps",
        "fast",
      ],
    },
  },
} as const;

/**
 * Get the provider-specific model ID for a given unified model name and provider
 */
export function getProviderModelId(
  unifiedModelName: string,
  provider: VideoProvider,
): { provider: VideoProvider; modelId: string } {
  const mapping = (unifiedModelRegistry as any)[unifiedModelName];

  if (!mapping) {
    throw new Error(`Unknown unified model: ${unifiedModelName}`);
  }

  const providerModelId = mapping.providers[provider];

  if (!providerModelId) {
    const availableProviders = Object.keys(mapping.providers).join(", ");
    throw new Error(
      `Model "${unifiedModelName}" is not available on provider "${provider}". ` +
        `Available providers: ${availableProviders}`,
    );
  }

  return {
    provider: provider,
    modelId: providerModelId,
  };
}

/**
 * Get all available providers for a unified model
 */
export function getAvailableProviders(
  unifiedModelName: string,
): VideoProvider[] {
  const mapping = (unifiedModelRegistry as any)[unifiedModelName];

  if (!mapping) {
    throw new Error(`Unknown unified model: ${unifiedModelName}`);
  }

  return Object.keys(mapping.providers) as VideoProvider[];
}

/**
 * Check if a model is available on a specific provider
 */
export function isModelAvailableOnProvider(
  unifiedModelName: string,
  provider: VideoProvider,
): boolean {
  const mapping = (unifiedModelRegistry as any)[unifiedModelName];
  return mapping ? !!mapping.providers[provider] : false;
}

/**
 * Get unified model mapping by provider-specific ID
 * Useful for reverse lookup
 */
export function getUnifiedModelFromProviderId(
  providerModelId: string,
  provider: VideoProvider,
): UnifiedModelMapping | undefined {
  return (Object.values(unifiedModelRegistry) as any[]).find(
    (mapping) => mapping.providers[provider] === providerModelId,
  );
}

/**
 * List all unified models
 */
export function listUnifiedModels(): UnifiedModelMapping[] {
  return Object.values(unifiedModelRegistry) as any;
}

/**
 * List unified models by media type
 */
export function listUnifiedModelsByType(
  mediaType: "video" | "image" | "audio",
): UnifiedModelMapping[] {
  return (Object.values(unifiedModelRegistry) as any).filter(
    (mapping: any) => mapping.mediaType === mediaType,
  );
}

/**
 * List unified models by creator
 */
export function listUnifiedModelsByCreator(
  creator: string,
): UnifiedModelMapping[] {
  return (Object.values(unifiedModelRegistry) as any).filter(
    (mapping: any) => mapping.creator === creator,
  );
}
