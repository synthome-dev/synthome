import type { ParameterMapping } from "../../../unified.js";
import type { Seedance1ProRawOptions } from "./schema.js";

export const seedanceMapping: ParameterMapping<Seedance1ProRawOptions> = {
  toProviderOptions: (unified) => ({
    prompt: unified.prompt,
    duration: unified.duration,
    resolution: unified.resolution,
    aspect_ratio: unified.aspectRatio,
    seed: unified.seed,
    image: unified.startImage,
    last_frame_image: unified.endImage,
    camera_fixed: unified.cameraMotion === "fixed",
  }),
  fromProviderOptions: (provider) => ({
    prompt: provider.prompt,
    duration: provider.duration,
    resolution: provider.resolution,
    aspectRatio: provider.aspect_ratio,
    seed: provider.seed,
    startImage: provider.image,
    endImage: provider.last_frame_image,
    cameraMotion: provider.camera_fixed ? "fixed" : "dynamic",
  }),
};
