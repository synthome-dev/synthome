import type { ImageGenerationMapping } from "../../../unified.js";
import type { Seedream4RawOptions } from "./image-schema.js";
import type { UnifiedImageOptions } from "../../../unified.js";

export const seedreamMapping: ImageGenerationMapping<Seedream4RawOptions> = {
  // Convert from unified parameters to seedream-specific format
  toProviderOptions: (unified: UnifiedImageOptions): Seedream4RawOptions => ({
    prompt: unified.prompt || "",
    image_input: Array.isArray(unified.image)
      ? unified.image
      : unified.image
        ? [unified.image]
        : undefined,
    aspect_ratio: unified.aspectRatio,
    // Seedream doesn't have output_format in the same way, it generates based on size
  }),

  // Convert from seedream-specific format to unified parameters
  fromProviderOptions: (
    provider: Seedream4RawOptions,
  ): Partial<UnifiedImageOptions> => ({
    prompt: provider.prompt,
    image: provider.image_input,
    aspectRatio: provider.aspect_ratio,
  }),
};
