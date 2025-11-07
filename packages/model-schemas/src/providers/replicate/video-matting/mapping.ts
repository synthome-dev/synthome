import type { ParameterMapping } from "../../../unified.js";
import type { UnifiedBackgroundRemovalOptions } from "../../../unified.js";
import type { RobustVideoMattingRawOptions } from "./schema.js";

export const videoMattingMapping: ParameterMapping<
  UnifiedBackgroundRemovalOptions,
  RobustVideoMattingRawOptions
> = {
  toProviderOptions: (unified) => {
    return {
      input_video: unified.video,
      output_type: unified.outputType || "green-screen",
    };
  },
  fromProviderOptions: (provider) => {
    return {
      video: provider.input_video,
      outputType: provider.output_type,
    };
  },
};
