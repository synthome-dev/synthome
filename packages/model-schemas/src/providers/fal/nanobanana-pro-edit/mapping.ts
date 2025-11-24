import type { ImageGenerationMapping } from "../../../unified.js";
import type { NanobananaProEditRawOptions } from "./schema.js";
import type { UnifiedImageOptions } from "../../../unified.js";

export const nanobananaProEditMapping: ImageGenerationMapping<NanobananaProEditRawOptions> =
  {
    // Convert from unified parameters to nanobanana-pro-edit-specific format
    toProviderOptions: (
      unified: UnifiedImageOptions,
    ): NanobananaProEditRawOptions => {
      // Edit endpoint requires image_urls
      if (!unified.image) {
        throw new Error(
          "image is required for fal-ai/nano-banana-pro/edit endpoint",
        );
      }

      // Ensure image is always an array for the edit endpoint
      const imageArray = Array.isArray(unified.image)
        ? unified.image
        : [unified.image];

      if (imageArray.length === 0) {
        throw new Error(
          "At least one image is required for fal-ai/nano-banana-pro/edit endpoint",
        );
      }

      return {
        prompt: unified.prompt || "",
        image_urls: imageArray,
        aspect_ratio: unified.aspectRatio as any,
        output_format: unified.outputFormat as
          | "jpeg"
          | "png"
          | "webp"
          | undefined,
      };
    },

    // Convert from nanobanana-pro-edit-specific format to unified parameters
    fromProviderOptions: (
      provider: NanobananaProEditRawOptions,
    ): Partial<UnifiedImageOptions> => ({
      prompt: provider.prompt,
      image: provider.image_urls,
      aspectRatio:
        provider.aspect_ratio === "auto" ? undefined : provider.aspect_ratio,
      outputFormat: provider.output_format as
        | "jpg"
        | "png"
        | "webp"
        | undefined,
    }),
  };
