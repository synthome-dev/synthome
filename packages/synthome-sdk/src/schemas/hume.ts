import {
  humeCapabilities,
  parseHumeAudio,
  humeAudioModels,
  humeTtsOptionsSchema,
  type HumeAudioModelId,
  type HumeTtsOptions,
} from "./providers/hume/index.js";

// Export schemas object
export const humeSchemas = humeAudioModels;

// Export types and functions
export { humeCapabilities, parseHumeAudio };
export type { HumeAudioModelId, HumeTtsOptions };

// Re-export for compatibility
export const humeMappings = {} as const;

export type HumeModelId = HumeAudioModelId;

export interface HumeModels {
  "hume/tts": HumeTtsOptions;
}
