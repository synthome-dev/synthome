import { z } from "zod";
import {
  elevenLabsAudioModels,
  type ElevenLabsAudioModelId,
  elevenLabsCapabilities,
  elevenLabsModelCapabilities,
  parseElevenLabsAudio,
} from "./providers/elevenlabs/index.js";

export const elevenLabsSchemas = {
  ...elevenLabsAudioModels,
} as const;

export type ElevenLabsModelId = ElevenLabsAudioModelId;

export interface ElevenLabsModels {
  "elevenlabs/turbo-v2.5": z.infer<
    (typeof elevenLabsAudioModels)["elevenlabs/turbo-v2.5"]
  >;
}

// ElevenLabs doesn't need mappings since parameters are already in camelCase
export const elevenLabsMappings = {} as const;

export * from "./providers/elevenlabs/index.js";
