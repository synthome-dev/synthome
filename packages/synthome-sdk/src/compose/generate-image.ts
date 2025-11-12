import type { ImageModel, ProviderConfig } from "../core/types.js";
import type { ImageOperation } from "../core/video.js";

export interface GenerateImageOptions<TModelOptions extends ProviderConfig> {
  model: ImageModel<TModelOptions>;
}

export type GenerateImageProvider<TModelOptions extends ProviderConfig> =
  GenerateImageOptions<TModelOptions> & Omit<TModelOptions, "apiKey">;

export function generateImage<TModelOptions extends ProviderConfig>(
  options: GenerateImageProvider<TModelOptions>,
): ImageOperation {
  const { model, ...restOptions } = options as any;

  const params = {
    provider: model.provider,
    modelId: model.modelId,
    apiKey: model.options.apiKey,
    ...restOptions,
  };

  return {
    type: "generateImage",
    params,
  };
}
