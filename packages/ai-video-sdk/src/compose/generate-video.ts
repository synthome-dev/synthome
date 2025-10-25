import type { UnifiedVideoOptions } from "@repo/model-schemas";
import type { ProviderConfig, VideoModel } from "../core/types.js";
import type { VideoOperation } from "../core/video.js";

export interface GenerateVideoOptions<TModelOptions extends ProviderConfig> {
  model: VideoModel<TModelOptions>;
}

export type GenerateVideoUnified = GenerateVideoOptions<ProviderConfig> &
  UnifiedVideoOptions;

export type GenerateVideoProvider<TModelOptions extends ProviderConfig> =
  GenerateVideoOptions<TModelOptions> & TModelOptions;

function isUnifiedOptions(
  options: GenerateVideoUnified | GenerateVideoProvider<any>,
): options is GenerateVideoUnified {
  return "prompt" in options;
}

export function generateVideo<TModelOptions extends ProviderConfig>(
  options: GenerateVideoUnified | GenerateVideoProvider<TModelOptions>,
): VideoOperation {
  const { model } = options;

  let params: Record<string, unknown>;

  if (isUnifiedOptions(options)) {
    const {
      prompt,
      duration,
      resolution,
      aspectRatio,
      seed,
      startImage,
      endImage,
      cameraMotion,
    } = options;

    params = {
      provider: model.provider,
      modelId: model.modelId,
      apiKey: model.options.apiKey,
      unified: true,
      prompt,
      duration,
      resolution,
      aspectRatio,
      seed,
      startImage,
      endImage,
      cameraMotion,
    };
  } else {
    params = {
      provider: model.provider,
      modelId: model.modelId,
      apiKey: model.options.apiKey,
      unified: false,
      ...(options as unknown as Record<string, unknown>),
    };
  }

  return {
    type: "generate",
    params,
  };
}
