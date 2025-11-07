import type { VideoGenerationMapping } from "../../../unified.js";
import type { Fabric1FastRawOptions } from "./schema.js";

/**
 * Parameter mapping for VEED Fabric 1.0 Fast
 * Maps between unified video options and Fabric-specific parameters
 */
export const fabricMapping: VideoGenerationMapping<Fabric1FastRawOptions> = {
  // Convert from unified parameters to Fabric-specific format
  toProviderOptions: (unified) => {
    // Map resolution, defaulting to 720p and ensuring it's valid for Fabric
    const resolution =
      unified.resolution === "1080p"
        ? ("720p" as const) // Fabric doesn't support 1080p, downgrade to 720p
        : (unified.resolution as "720p" | "480p" | undefined) || "720p";

    return {
      image_url: unified.image || unified.startImage || "",
      audio_url: unified.audio || "",
      resolution,
    };
  },

  // Convert from Fabric-specific format to unified parameters
  fromProviderOptions: (provider) => ({
    prompt: "", // Fabric doesn't use prompts, it's image-to-video with audio
    image: provider.image_url,
    audio: provider.audio_url,
    resolution: provider.resolution,
  }),
};
