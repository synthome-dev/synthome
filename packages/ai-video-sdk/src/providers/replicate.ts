import type {
  ReplicateModelId,
  ReplicateModels,
  Seedance1ProOptions,
} from "@repo/model-schemas";
import type { ProviderConfig, VideoModel } from "../core/types.js";

export type { ReplicateModelId, ReplicateModels, Seedance1ProOptions };

export function replicate<T extends ReplicateModelId>(
  modelId: T,
  options?: ReplicateModels[T]
): VideoModel<ReplicateModels[T]>;

export function replicate<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions
): VideoModel<TOptions>;

export function replicate(
  modelId: string,
  options: ProviderConfig = {}
): VideoModel {
  return {
    provider: "replicate",
    modelId,
    options,
  };
}
