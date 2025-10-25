import type { VideoModel, ProviderConfig } from "../core/types.js";
import type {
  GoogleCloudModels,
  GoogleCloudModelId,
} from "@repo/model-schemas";

export type { GoogleCloudModels, GoogleCloudModelId };

export function googleCloud<T extends GoogleCloudModelId>(
  modelId: T,
  options?: GoogleCloudModels[T],
): VideoModel<GoogleCloudModels[T]>;

export function googleCloud<TOptions extends ProviderConfig = ProviderConfig>(
  modelId: string,
  options?: TOptions,
): VideoModel<TOptions>;

export function googleCloud(
  modelId: string,
  options: ProviderConfig = {},
): VideoModel {
  return {
    provider: "google-cloud",
    modelId,
    options,
  };
}
