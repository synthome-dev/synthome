import type { ImageGenerationMapping } from "../../../unified.js";
import type { NanobananaProRawOptions } from "./schema.js";
import type { UnifiedImageOptions } from "../../../unified.js";

export const nanobananaProMapping: ImageGenerationMapping<NanobananaProRawOptions> =
  {
    // Convert from unified parameters to nanobanana-pro-specific format
    toProviderOptions: (
      unified: UnifiedImageOptions,
    ): NanobananaProRawOptions => ({
      prompt: unified.prompt,
      image_input: unified.imageInputs,
      aspect_ratio: unified.aspectRatio,
      output_format: unified.outputFormat,
      // Note: resolution and safety_filter_level are provider-specific
      // and should be passed directly in the request
    }),

    // Convert from nanobanana-pro-specific format to unified parameters
    fromProviderOptions: (
      provider: NanobananaProRawOptions,
    ): Partial<UnifiedImageOptions> => ({
      prompt: provider.prompt,
      imageInputs: provider.image_input,
      aspectRatio: provider.aspect_ratio,
      outputFormat: provider.output_format as
        | "jpg"
        | "png"
        | "webp"
        | undefined,
    }),
  };
