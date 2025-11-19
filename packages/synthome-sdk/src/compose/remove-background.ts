import type { VideoModel } from "../core/types.js";
import type { VideoOperation } from "../core/video.js";
import type { RobustVideoMattingRawOptions } from "../schemas/replicate.js";

export interface RemoveBackgroundWithModelOptions {
  model: VideoModel<any>;
  video: string; // Direct URL to video
}

export type RemoveBackgroundWithModelUnified =
  RemoveBackgroundWithModelOptions &
    Partial<Omit<RobustVideoMattingRawOptions, "input_video">>;

export function removeBackgroundWithModel(
  options: RemoveBackgroundWithModelUnified,
): VideoOperation {
  const { model, video, ...rest } = options;

  const params: Record<string, unknown> = {
    provider: model.provider,
    modelId: model.modelId,
    apiKey: model.options.apiKey,
    input_video: video,
    ...rest,
  };

  return {
    type: "removeBackground",
    params,
  };
}
