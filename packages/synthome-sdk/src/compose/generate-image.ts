import type { ImageModel, ProviderConfig } from "../core/types.js";
import type { ImageOperation } from "../core/video.js";
import type { UnifiedImageOptions } from "../schemas/unified.js";

/**
 * Optional per-job webhook notification
 * When true, a webhook will be sent to the execution's webhook URL when this job completes
 */
export interface JobWebhookOptions {
  /** Send a webhook when this specific job completes (uses execution's webhook URL) */
  sendJobWebhook?: boolean;
}

export interface GenerateImageOptions<TModelOptions extends ProviderConfig> {
  model: ImageModel<TModelOptions>;
}

export type GenerateImageProvider<TModelOptions extends ProviderConfig> =
  GenerateImageOptions<TModelOptions> &
    Omit<TModelOptions, "apiKey"> &
    JobWebhookOptions;

export type GenerateImageUnified = {
  model: ImageModel<any>;
} & UnifiedImageOptions &
  JobWebhookOptions;

export function generateImage<TModelOptions extends ProviderConfig>(
  options: GenerateImageProvider<TModelOptions> | GenerateImageUnified,
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
