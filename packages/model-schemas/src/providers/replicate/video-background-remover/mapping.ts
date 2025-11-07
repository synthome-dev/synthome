import type {
  BackgroundRemovalMapping,
  UnifiedBackgroundRemovalOptions,
} from "../../../unified.js";
import type { NaterawVideoBackgroundRemoverRawOptions } from "./schema.js";

/**
 * Parameter mapping for nateraw/video-background-remover
 * This model only accepts 'video' parameter (no output_type option)
 */
export const naterawVideoBackgroundRemoverMapping: BackgroundRemovalMapping<NaterawVideoBackgroundRemoverRawOptions> =
  {
    toProviderOptions: (
      unified: UnifiedBackgroundRemovalOptions,
    ): NaterawVideoBackgroundRemoverRawOptions => {
      return {
        video: unified.video,
        // Note: This model doesn't support outputType - it always outputs green screen
      };
    },
    fromProviderOptions: (
      provider: NaterawVideoBackgroundRemoverRawOptions,
    ): Partial<UnifiedBackgroundRemovalOptions> => {
      return {
        video: provider.video,
        // outputType is not available in this model
      };
    },
  };
