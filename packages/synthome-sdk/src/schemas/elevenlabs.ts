import {
  elevenLabsCapabilities,
  parseElevenLabsAudio,
  elevenLabsAudioModels,
  type ElevenLabsAudioModelId,
  type ElevenLabsTurboV25Options,
} from "./providers/elevenlabs/index.js";

// Export schemas object
export const elevenLabsSchemas = elevenLabsAudioModels;

// Export types and functions
export { elevenLabsCapabilities, parseElevenLabsAudio };
export type { ElevenLabsAudioModelId, ElevenLabsTurboV25Options };

// Re-export for compatibility
export const elevenLabsMappings = {} as const;

export type ElevenLabsModelId = ElevenLabsAudioModelId;

export interface ElevenLabsModels {
  "elevenlabs/turbo-v2.5": ElevenLabsTurboV25Options;
}
