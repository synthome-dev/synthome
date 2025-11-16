import { z } from "zod";
import {
  humeAudioModels,
  type HumeAudioModelId,
  humeCapabilities,
  humeModelCapabilities,
  parseHumeAudio,
} from "./providers/hume/index.js";

export const humeSchemas = {
  ...humeAudioModels,
} as const;

export type HumeModelId = HumeAudioModelId;

export interface HumeModels {
  "hume/tts": z.infer<(typeof humeAudioModels)["hume/tts"]>;
}

// Hume doesn't need mappings since it's direct API
export const humeMappings = {} as const;

export * from "./providers/hume/index.js";
