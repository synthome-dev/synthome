import type { UnifiedVideoOptions } from "@repo/model-schemas";
import type { ProviderConfig, VideoModel } from "../core/types.js";
import type { VideoOperation, ImageOperation } from "../core/video.js";

export interface GenerateVideoOptions<TModelOptions extends ProviderConfig> {
  model: VideoModel<TModelOptions>;
  image?: string | ImageOperation; // Direct URL or nested image generation
}

export type GenerateVideoUnified = GenerateVideoOptions<ProviderConfig> &
  UnifiedVideoOptions;

export type GenerateVideoProvider<TModelOptions extends ProviderConfig> =
  GenerateVideoOptions<TModelOptions> & Omit<TModelOptions, "image">;

function isUnifiedOptions(
  options: GenerateVideoUnified | GenerateVideoProvider<any>,
): options is GenerateVideoUnified {
  return "prompt" in options;
}

export function generateVideo<TModelOptions extends ProviderConfig>(
  options: GenerateVideoUnified | GenerateVideoProvider<TModelOptions>,
): VideoOperation {
  const { model, image } = options;

  let params: Record<string, unknown>;

  // Handle image parameter - can be string URL or ImageOperation
  let imageValue: string | ImageOperation | undefined = undefined;
  if (image) {
    if (typeof image === "string") {
      imageValue = image; // Direct URL
    } else if (typeof image === "object" && image.type === "generateImage") {
      imageValue = image; // ImageOperation - will be resolved by pipeline
    }
  }

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
      image: imageValue,
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
      image: imageValue,
    };
  }

  return {
    type: "generate",
    params,
  };
}
