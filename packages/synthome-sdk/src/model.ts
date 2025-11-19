/**
 * Unified Model Creation
 *
 * This module provides a simplified API for creating model instances using
 * unified model names that work across providers.
 *
 * Example:
 *   const nanobanana = model("google/nano-banana", "fal");
 *   const nanobanana2 = model("google/nano-banana", { provider: "replicate", apiKey: "..." });
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
  getAvailableProviders,
  unifiedModelRegistry,
  type UnifiedModelMapping,
} from "./schemas/unified-models.js";
import { replicate } from "./providers/replicate.js";
import { fal } from "./providers/fal.js";
import { googleCloud } from "./providers/google-cloud.js";
import { hume } from "./providers/hume.js";
import { elevenlabs } from "./providers/elevenlabs.js";

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

/**
 * Create a model instance using a unified model name with a provider string.
 *
 * @example
 * ```typescript
 * // Simple usage with provider string
 * const nanobanana = model("google/nano-banana", "fal");
 * const nanobanana2 = model("google/nano-banana", "replicate");
 * ```
 */
export function model(
  unifiedModelName: string,
  provider: VideoProvider,
): VideoModel<any> | ImageModel<any> | AudioModel<any>;

/**
 * Create a model instance using a unified model name with options object.
 *
 * @example
 * ```typescript
 * // With options object (includes API key)
 * const nanobanana = model("google/nano-banana", {
 *   provider: "fal",
 *   apiKey: "your-fal-key"
 * });
 * ```
 */
export function model(
  unifiedModelName: string,
  options: ModelOptions,
): VideoModel<any> | ImageModel<any> | AudioModel<any>;

/**
 * Implementation
 */
export function model(
  unifiedModelName: string,
  providerOrOptions: VideoProvider | ModelOptions,
): VideoModel<any> | ImageModel<any> | AudioModel<any> {
  // Parse the provider and options
  let provider: VideoProvider;
  let apiKey: string | undefined;

  if (typeof providerOrOptions === "string") {
    // Simple case: provider string
    provider = providerOrOptions;
    apiKey = undefined;
  } else {
    // Options object
    provider = providerOrOptions.provider;
    apiKey = providerOrOptions.apiKey;
  }

  // Get the provider-specific model ID
  const { modelId } = getProviderModelId(unifiedModelName, provider);

  // Create the model instance using the appropriate provider function
  const providerConfig: ProviderConfig = {
    apiKey,
  };

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

/**
 * Get information about a unified model
 */
export function getModelInfo(
  unifiedModelName: string,
): UnifiedModelMapping | undefined {
  return (unifiedModelRegistry as any)[unifiedModelName];
}

/**
 * List all available providers for a model
 *
 * @example
 * ```typescript
 * const providers = listModelProviders("google/nano-banana");
 * console.log(providers); // ["replicate", "fal"]
 * ```
 */
export function listModelProviders(unifiedModelName: string): VideoProvider[] {
  return getAvailableProviders(unifiedModelName);
}

/**
 * Check if a model is available on a specific provider
 *
 * @example
 * ```typescript
 * if (isModelAvailable("google/nano-banana", "fal")) {
 *   const model = model("google/nano-banana", { provider: "fal" });
 * }
 * ```
 */
export function isModelAvailable(
  unifiedModelName: string,
  provider: VideoProvider,
): boolean {
  const mapping = (unifiedModelRegistry as any)[unifiedModelName];
  return mapping ? !!mapping.providers[provider] : false;
}

export { type UnifiedModelMapping } from "./schemas/unified-models.js";
