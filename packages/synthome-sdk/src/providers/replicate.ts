import type {
  ReplicateModelId,
  ReplicateVideoModelId,
  ReplicateImageModelId,
  ReplicateAudioModelId,
  ReplicateModels,
  Seedance1ProOptions,
} from "../schemas/replicate.js";
import type {
  AudioModel,
  ImageModel,
  ProviderConfig,
  VideoModel,
} from "../core/types.js";

export type { ReplicateModelId, ReplicateModels, Seedance1ProOptions };

// Scalable type helper - uses type-level categorization from registry
type ReplicateModelType<T extends ReplicateModelId> =
  T extends ReplicateAudioModelId
    ? AudioModel<ReplicateModels[T]>
    : T extends ReplicateImageModelId
      ? ImageModel<ReplicateModels[T]>
      : T extends ReplicateVideoModelId
        ? VideoModel<ReplicateModels[T]>
        : VideoModel<ReplicateModels[T]>; // Default to video for unknown

// Overload for known Replicate models with type-specific returns
// Note: options parameter only needs ProviderConfig, but return type uses full schema for type inference
export function replicate<T extends ReplicateModelId>(
  modelId: T,
  options?: ProviderConfig,
): ReplicateModelType<T>;

// Overload for unknown models (defaults to VideoModel)
export function replicate<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): VideoModel<TOptions>;

// Implementation
export function replicate(
  modelId: string,
  options: ProviderConfig = {},
): VideoModel | ImageModel | AudioModel {
  return {
    provider: "replicate",
    modelId,
    options,
  };
}
