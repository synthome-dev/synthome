import type { VideoModel, ProviderConfig } from "../core/types.js";
import type {
  ReplicateModels,
  ReplicateModelId,
  Seedance1ProOptions,
} from "@repo/model-schemas";

export type { ReplicateModels, ReplicateModelId, Seedance1ProOptions };

export function replicate<T extends ReplicateModelId>(
  modelId: T,
  options?: ReplicateModels[T],
): VideoModel<ReplicateModels[T]>;

export function replicate<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): VideoModel<TOptions>;

export function replicate(
  modelId: string,
  options: ProviderConfig = {},
): VideoModel {
  return {
    provider: "replicate",
    modelId,
    options,
  };
}
