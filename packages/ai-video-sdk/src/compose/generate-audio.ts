import type { AudioModel, ProviderConfig } from "../core/types.js";
import type { AudioOperation } from "../core/video.js";

export interface GenerateAudioOptions<TModelOptions extends ProviderConfig> {
  model: AudioModel<TModelOptions>;
}

export type GenerateAudioProvider<TModelOptions extends ProviderConfig> =
  GenerateAudioOptions<TModelOptions> & Omit<TModelOptions, "apiKey">;

export function generateAudio<TModelOptions extends ProviderConfig>(
  options: GenerateAudioProvider<TModelOptions>,
): AudioOperation {
  const { model, ...restOptions } = options as any;

  const params = {
    provider: model.provider,
    modelId: model.modelId,
    apiKey: model.options.apiKey,
    ...restOptions,
  };

  return {
    type: "generateAudio",
    params,
  };
}
