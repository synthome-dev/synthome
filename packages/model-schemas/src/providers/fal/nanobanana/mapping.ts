import type { ImageGenerationMapping } from "../../../unified.js";
import type { NanobananaRawOptions } from "./schema.js";
import type { UnifiedImageOptions } from "../../../unified.js";

export const nanobananaMapping: ImageGenerationMapping<NanobananaRawOptions> = {
  // Convert from unified parameters to fal nanobanana-specific format
  toProviderOptions: (unified: UnifiedImageOptions): NanobananaRawOptions => {
    // Convert jpg to jpeg for fal API
    const outputFormat =
      unified.outputFormat === "jpg" ? "jpeg" : unified.outputFormat;

    return {
      prompt: unified.prompt,
      aspect_ratio: unified.aspectRatio as any,
      output_format: outputFormat as "jpeg" | "png" | "webp" | undefined,
    };
  },

  // Convert from fal nanobanana-specific format to unified parameters
  fromProviderOptions: (
    provider: NanobananaRawOptions,
  ): Partial<UnifiedImageOptions> => {
    // Convert jpeg to jpg for unified API
    const outputFormat =
      provider.output_format === "jpeg" ? "jpg" : provider.output_format;

    return {
      prompt: provider.prompt,
      aspectRatio: provider.aspect_ratio,
      outputFormat: outputFormat as "jpg" | "png" | "webp" | undefined,
    };
  },
};
