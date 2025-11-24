import type { ImageGenerationMapping } from "../../../unified.js";
import type { NanobananaRawOptions } from "./schema.js";
import type { UnifiedImageOptions } from "../../../unified.js";

export const nanobananaMapping: ImageGenerationMapping<NanobananaRawOptions> = {
  // Convert from unified parameters to nanobanana-specific format
  toProviderOptions: (unified: UnifiedImageOptions): NanobananaRawOptions => ({
    prompt: unified.prompt || "",
    image_input: Array.isArray(unified.image)
      ? unified.image
      : unified.image
        ? [unified.image]
        : undefined,
    aspect_ratio: unified.aspectRatio,
    output_format: unified.outputFormat as "jpg" | "png" | undefined,
  }),

  // Convert from nanobanana-specific format to unified parameters
  fromProviderOptions: (
    provider: NanobananaRawOptions,
  ): Partial<UnifiedImageOptions> => ({
    prompt: provider.prompt,
    image: provider.image_input,
    aspectRatio: provider.aspect_ratio,
    outputFormat: provider.output_format,
  }),
};
