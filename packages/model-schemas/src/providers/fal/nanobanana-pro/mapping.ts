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
      aspect_ratio: unified.aspectRatio as any,
      output_format: unified.outputFormat as
        | "jpeg"
        | "png"
        | "webp"
        | undefined,
      // num_images, sync_mode, resolution are provider-specific
    }),

    // Convert from nanobanana-pro-specific format to unified parameters
    fromProviderOptions: (
      provider: NanobananaProRawOptions,
    ): Partial<UnifiedImageOptions> => ({
      prompt: provider.prompt,
      aspectRatio: provider.aspect_ratio,
      outputFormat: provider.output_format as
        | "jpg"
        | "png"
        | "webp"
        | undefined,
    }),
  };
