import type { UnifiedVideoOptions } from "@repo/model-schemas";
import type { ProviderConfig, VideoModel } from "../core/types.js";
import type {
  VideoOperation,
  ImageOperation,
  AudioOperation,
} from "../core/video.js";

export interface GenerateVideoOptions<TModelOptions extends ProviderConfig> {
  model: VideoModel<TModelOptions>;
  image?: string | ImageOperation; // Direct URL or nested image generation
  audio?: string | AudioOperation; // Direct URL or nested audio generation
}

export type GenerateVideoUnified = GenerateVideoOptions<ProviderConfig> &
  UnifiedVideoOptions;

export type GenerateVideoProvider<TModelOptions extends ProviderConfig> =
  GenerateVideoOptions<TModelOptions> &
    Partial<Omit<TModelOptions, "image" | "audio" | "apiKey">>;

function isUnifiedOptions(
  options: GenerateVideoUnified | GenerateVideoProvider<any>,
): options is GenerateVideoUnified {
  return "prompt" in options;
}

export function generateVideo<TModelOptions extends ProviderConfig>(
  options: GenerateVideoUnified | GenerateVideoProvider<TModelOptions>,
): VideoOperation {
  const { model, image, audio } = options;

  let params: Record<string, unknown>;

  // Handle image parameter - can be string URL or ImageOperation
  let imageValue: string | ImageOperation | undefined = undefined;
  if (image) {
    if (typeof image === "string") {
      imageValue = image; // Direct URL
    } else if (
      typeof image === "object" &&
      (image.type === "generateImage" || image.type === "removeImageBackground")
    ) {
      imageValue = image; // ImageOperation - will be resolved by pipeline
    }
  }

  // Handle audio parameter - can be string URL or AudioOperation
  let audioValue: string | AudioOperation | undefined = undefined;
  if (audio) {
    if (typeof audio === "string") {
      audioValue = audio; // Direct URL
    } else if (typeof audio === "object" && audio.type === "generateAudio") {
      audioValue = audio; // AudioOperation - will be resolved by pipeline
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
      audio: audioValue,
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
      audio: audioValue,
    };
  }

  return {
    type: "generate",
    params,
  };
}
