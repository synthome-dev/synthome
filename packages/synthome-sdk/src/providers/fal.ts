import type {
  FalModelId,
  FalVideoModelId,
  FalImageModelId,
  FalAudioModelId,
  FalModels,
  Fabric1FastOptions,
} from "../schemas/fal.js";
import type {
  AudioModel,
  ImageModel,
  ProviderConfig,
  VideoModel,
} from "../core/types.js";

export type { FalModelId, FalModels, Fabric1FastOptions };

// Scalable type helper - uses type-level categorization from registry
type FalModelType<T extends FalModelId> = T extends FalAudioModelId
  ? AudioModel<FalModels[T]>
  : T extends FalImageModelId
    ? ImageModel<FalModels[T]>
    : T extends FalVideoModelId
      ? VideoModel<FalModels[T]>
      : VideoModel<FalModels[T]>; // Default to video for unknown

// Overload for known FAL models with type-specific returns
// Note: options parameter only needs ProviderConfig, but return type uses full schema for type inference
export function fal<T extends FalModelId>(
  modelId: T,
  options?: ProviderConfig,
): FalModelType<T>;

// Overload for unknown models (defaults to VideoModel)
export function fal<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): VideoModel<TOptions>;

// Implementation
export function fal(
  modelId: string,
  options: ProviderConfig = {},
): VideoModel | ImageModel | AudioModel {
  return {
    provider: "fal",
    modelId,
    options,
  };
}
