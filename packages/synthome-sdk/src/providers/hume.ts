import type {
  HumeModelId,
  HumeAudioModelId,
  HumeModels,
} from "../schemas/hume.js";
import type { AudioModel, ProviderConfig } from "../core/types.js";

export type { HumeModelId, HumeModels };

// Scalable type helper - uses type-level categorization from registry
type HumeModelType<T extends HumeModelId> = T extends HumeAudioModelId
  ? AudioModel<HumeModels[T]>
  : AudioModel<HumeModels[T]>; // Default to audio

// Overload for known Hume models with type-specific returns
// Note: options parameter only needs ProviderConfig, but return type uses full schema for type inference
export function hume<T extends HumeModelId>(
  modelId: T,
  options?: ProviderConfig,
): HumeModelType<T>;

// Overload for unknown models (defaults to AudioModel)
export function hume<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): AudioModel<TOptions>;

// Implementation
export function hume(
  modelId: string,
  options: ProviderConfig = {},
): AudioModel {
  return {
    provider: "hume",
    modelId,
    options,
  };
}
