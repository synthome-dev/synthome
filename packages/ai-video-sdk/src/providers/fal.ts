import type { VideoModel, ProviderConfig } from "../core/types.js";
import type { FalModels, FalModelId } from "@repo/model-schemas";

export type { FalModels, FalModelId };

export function fal<T extends FalModelId>(
  modelId: T,
  options?: FalModels[T],
): VideoModel<FalModels[T]>;

export function fal<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): VideoModel<TOptions>;

export function fal(modelId: string, options: ProviderConfig = {}): VideoModel {
  return {
    provider: "fal",
    modelId,
    options,
  };
}
