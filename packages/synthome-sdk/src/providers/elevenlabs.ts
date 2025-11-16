import type {
  ElevenLabsModelId,
  ElevenLabsAudioModelId,
  ElevenLabsModels,
} from "../schemas/elevenlabs.js";
import type { AudioModel, ProviderConfig } from "../core/types.js";

export type { ElevenLabsModelId, ElevenLabsModels };

// Scalable type helper - uses type-level categorization from registry
type ElevenLabsModelType<T extends ElevenLabsModelId> =
  T extends ElevenLabsAudioModelId
    ? AudioModel<ElevenLabsModels[T]>
    : AudioModel<ElevenLabsModels[T]>; // Default to audio

// Overload for known ElevenLabs models with type-specific returns
// Note: options parameter only needs ProviderConfig, but return type uses full schema for type inference
export function elevenlabs<T extends ElevenLabsModelId>(
  modelId: T,
  options?: ProviderConfig,
): ElevenLabsModelType<T>;

// Overload for unknown models (defaults to AudioModel)
export function elevenlabs<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): AudioModel<TOptions>;

// Implementation
export function elevenlabs(
  modelId: string,
  options: ProviderConfig = {},
): AudioModel {
  return {
    provider: "elevenlabs",
    modelId,
    options,
  };
}
