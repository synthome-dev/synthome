/**
 * Media-Specific Model Creation Functions
 *
 * This module provides type-safe, media-specific functions for creating model instances.
 * Each function provides autocomplete for:
 * 1. Available model names for that media type
 * 2. Available providers for the selected model
 *
 * Example:
 *   const img = imageModel("google/nano-banana", "fal"); // ✅ Full autocomplete
 *   const vid = videoModel("bytedance/seedance-1-pro", "replicate");
 *   const aud = audioModel("elevenlabs/turbo-v2.5", "elevenlabs");
 */

import type { VideoProvider } from "./schemas/registry.js";
import type {
  ProviderConfig,
  VideoModel,
  ImageModel,
  AudioModel,
} from "./core/types.js";
import {
  getProviderModelId,
  unifiedModelRegistry,
} from "./schemas/unified-models.js";
import { replicate } from "./providers/replicate.js";
import { fal } from "./providers/fal.js";
import { googleCloud } from "./providers/google-cloud.js";
import { hume } from "./providers/hume.js";
import { elevenlabs } from "./providers/elevenlabs.js";

// ============================================================================
// Type Utilities - Explicitly define model names by media type
// ============================================================================

// Explicitly list all image model names for better type inference
export type ImageModelName =
  | "google/nano-banana"
  | "bytedance/seedream-4"
  | "codeplugtech/background_remover";

// Explicitly list all video model names
export type VideoModelName =
  | "bytedance/seedance-1-pro"
  | "minimax/video-01"
  | "veed/fabric-1.0"
  | "veed/fabric-1.0/fast"
  | "arielreplicate/robust_video_matting"
  | "nateraw/video-background-remover";

// Explicitly list all audio model names
export type AudioModelName = "elevenlabs/turbo-v2.5" | "hume/tts";

// Get available providers for a specific model
type ProvidersForModel<T extends string> =
  T extends keyof typeof unifiedModelRegistry
    ? keyof (typeof unifiedModelRegistry)[T]["providers"]
    : never;

// ============================================================================
// Options Interface
// ============================================================================

export interface ModelOptions {
  /**
   * The provider to use for this model
   */
  provider: VideoProvider;

  /**
   * Optional API key for the provider
   */
  apiKey?: string;
}

// ============================================================================
// Internal helper to create model instance
// ============================================================================

function createModelInstance(
  unifiedModelName: string,
  provider: VideoProvider,
  apiKey?: string,
): VideoModel<any> | ImageModel<any> | AudioModel<any> {
  // Get the provider-specific model ID
  const { modelId } = getProviderModelId(unifiedModelName, provider);

  // Create the model instance using the appropriate provider function
  const providerConfig: ProviderConfig = { apiKey };

  switch (provider) {
    case "replicate":
      return replicate(modelId, providerConfig);
    case "fal":
      return fal(modelId, providerConfig);
    case "google-cloud":
      return googleCloud(modelId, providerConfig);
    case "hume":
      return hume(modelId, providerConfig);
    case "elevenlabs":
      return elevenlabs(modelId, providerConfig);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ============================================================================
// IMAGE MODEL FUNCTIONS
// ============================================================================

/**
 * Create an image model instance using a unified model name with a provider string.
 *
 * @example
 * ```typescript
 * // Simple usage with provider string - full autocomplete!
 * const nanobanana = imageModel("google/nano-banana", "fal");
 * const seedream = imageModel("bytedance/seedream-4", "replicate");
 * ```
 */
export function imageModel<T extends ImageModelName>(
  modelName: T,
  provider: ProvidersForModel<T>,
): ImageModel<any>;

/**
 * Create an image model instance using a unified model name with options object.
 *
 * @example
 * ```typescript
 * // With options object (includes API key)
 * const nanobanana = imageModel("google/nano-banana", {
 *   provider: "fal",
 *   apiKey: "your-fal-key"
 * });
 * ```
 */
export function imageModel<T extends ImageModelName>(
  modelName: T,
  options: { provider: ProvidersForModel<T>; apiKey?: string },
): ImageModel<any>;

/**
 * Implementation
 */
export function imageModel<T extends ImageModelName>(
  modelName: T,
  providerOrOptions:
    | ProvidersForModel<T>
    | { provider: ProvidersForModel<T>; apiKey?: string },
): ImageModel<any> {
  const provider =
    typeof providerOrOptions === "string"
      ? providerOrOptions
      : providerOrOptions.provider;
  const apiKey =
    typeof providerOrOptions === "object"
      ? providerOrOptions.apiKey
      : undefined;

  return createModelInstance(modelName, provider, apiKey) as ImageModel<any>;
}

// ============================================================================
// VIDEO MODEL FUNCTIONS
// ============================================================================

/**
 * Create a video model instance using a unified model name with a provider string.
 *
 * @example
 * ```typescript
 * // Simple usage with provider string - full autocomplete!
 * const seedance = videoModel("bytedance/seedance-1-pro", "replicate");
 * const minimax = videoModel("minimax/video-01", "replicate");
 * ```
 */
export function videoModel<T extends VideoModelName>(
  modelName: T,
  provider: ProvidersForModel<T>,
): VideoModel<any>;

/**
 * Create a video model instance using a unified model name with options object.
 *
 * @example
 * ```typescript
 * // With options object (includes API key)
 * const seedance = videoModel("bytedance/seedance-1-pro", {
 *   provider: "replicate",
 *   apiKey: "your-replicate-key"
 * });
 * ```
 */
export function videoModel<T extends VideoModelName>(
  modelName: T,
  options: { provider: ProvidersForModel<T>; apiKey?: string },
): VideoModel<any>;

/**
 * Implementation
 */
export function videoModel<T extends VideoModelName>(
  modelName: T,
  providerOrOptions:
    | ProvidersForModel<T>
    | { provider: ProvidersForModel<T>; apiKey?: string },
): VideoModel<any> {
  const provider =
    typeof providerOrOptions === "string"
      ? providerOrOptions
      : providerOrOptions.provider;
  const apiKey =
    typeof providerOrOptions === "object"
      ? providerOrOptions.apiKey
      : undefined;

  return createModelInstance(modelName, provider, apiKey) as VideoModel<any>;
}

// ============================================================================
// AUDIO MODEL FUNCTIONS
// ============================================================================

/**
 * Create an audio model instance using a unified model name with a provider string.
 *
 * @example
 * ```typescript
 * // Simple usage with provider string - full autocomplete!
 * const elevenlabs = audioModel("elevenlabs/turbo-v2.5", "elevenlabs");
 * const hume = audioModel("hume/tts", "hume");
 * ```
 */
export function audioModel<T extends AudioModelName>(
  modelName: T,
  provider: ProvidersForModel<T>,
): AudioModel<any>;

/**
 * Create an audio model instance using a unified model name with options object.
 *
 * @example
 * ```typescript
 * // With options object (includes API key)
 * const elevenlabs = audioModel("elevenlabs/turbo-v2.5", {
 *   provider: "elevenlabs",
 *   apiKey: "your-elevenlabs-key"
 * });
 * ```
 */
export function audioModel<T extends AudioModelName>(
  modelName: T,
  options: { provider: ProvidersForModel<T>; apiKey?: string },
): AudioModel<any>;

/**
 * Implementation
 */
export function audioModel<T extends AudioModelName>(
  modelName: T,
  providerOrOptions:
    | ProvidersForModel<T>
    | { provider: ProvidersForModel<T>; apiKey?: string },
): AudioModel<any> {
  const provider =
    typeof providerOrOptions === "string"
      ? providerOrOptions
      : providerOrOptions.provider;
  const apiKey =
    typeof providerOrOptions === "object"
      ? providerOrOptions.apiKey
      : undefined;

  return createModelInstance(modelName, provider, apiKey) as AudioModel<any>;
}
