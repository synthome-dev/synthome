import type { VideoGenerationMapping } from "../../../unified.js";
import type { MinimaxVideo01RawOptions } from "./schema.js";

export const minimaxMapping: VideoGenerationMapping<MinimaxVideo01RawOptions> =
  {
    toProviderOptions: (unified) => ({
      prompt: unified.prompt,
      prompt_optimizer: true, // Enable by default
    }),
    fromProviderOptions: (provider) => ({
      prompt: provider.prompt,
    }),
  };
