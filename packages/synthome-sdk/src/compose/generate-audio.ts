import type { AudioModel, ProviderConfig } from "../core/types.js";
import type { AudioOperation } from "../core/video.js";

/**
 * Optional per-job webhook notification
 * When true, a webhook will be sent to the execution's webhook URL when this job completes
 */
export interface JobWebhookOptions {
  /** Send a webhook when this specific job completes (uses execution's webhook URL) */
  sendJobWebhook?: boolean;
}

export interface GenerateAudioOptions<TModelOptions extends ProviderConfig> {
  model: AudioModel<TModelOptions>;
}

export type GenerateAudioProvider<TModelOptions extends ProviderConfig> =
  GenerateAudioOptions<TModelOptions> &
    Omit<TModelOptions, "apiKey"> &
    JobWebhookOptions;

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
