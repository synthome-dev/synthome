import { z } from "zod";

// Provider config schema
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

// ElevenLabs TTS base schema with camelCase parameters
const elevenLabsTurboV25BaseSchema = z.object({
  // Required parameters
  text: z
    .string()
    .min(1)
    .describe("Text to convert to speech (max 40,000 characters)"),

  voiceId: z
    .string()
    .describe(
      "Voice ID from ElevenLabs voice library. Example: '21m00Tcm4TlvDq8ikWAM' (Rachel)",
    ),

  // Optional: Model selection
  modelId: z
    .string()
    .default("eleven_turbo_v2_5")
    .describe(
      "ElevenLabs model to use. Options: 'eleven_turbo_v2_5', 'eleven_multilingual_v2', 'eleven_flash_v2_5'",
    ),

  // Voice settings
  stability: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Voice stability/consistency. Higher values = more stable/consistent. Range: 0.0-1.0. Default: 0.5",
    ),

  similarityBoost: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Voice similarity enhancement. Higher values = closer to original voice. Range: 0.0-1.0. Default: 0.75",
    ),

  style: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Style exaggeration (v2 models only). Higher values = more expressive. Range: 0.0-1.0. Default: 0.0",
    ),

  useSpeakerBoost: z
    .boolean()
    .optional()
    .describe(
      "Enable speaker boost for better audio quality in certain conditions. Default: true",
    ),

  // Optional: Output format
  outputFormat: z
    .enum([
      "mp3_44100_128",
      "mp3_44100_192",
      "pcm_16000",
      "pcm_22050",
      "pcm_24000",
      "pcm_44100",
    ])
    .default("mp3_44100_128")
    .describe("Audio output format. Default: mp3_44100_128"),

  // Optional: Language
  languageCode: z
    .string()
    .optional()
    .describe(
      "Language code (e.g., 'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar'). Supports 32 languages. Auto-detected if not specified",
    ),

  // Context for better pronunciation
  previousText: z
    .string()
    .optional()
    .describe(
      "Text that comes before this segment for better context and pronunciation",
    ),

  nextText: z
    .string()
    .optional()
    .describe(
      "Text that comes after this segment for better context and pronunciation",
    ),
});

export const elevenLabsTurboV25RawOptionsSchema = elevenLabsTurboV25BaseSchema;

export const elevenLabsTurboV25OptionsSchema =
  elevenLabsTurboV25BaseSchema.merge(providerConfigSchema);

export type ElevenLabsTurboV25RawOptions = z.infer<
  typeof elevenLabsTurboV25RawOptionsSchema
>;
export type ElevenLabsTurboV25Options = z.infer<
  typeof elevenLabsTurboV25OptionsSchema
>;

export const elevenLabsAudioModels = {
  "elevenlabs/turbo-v2.5": elevenLabsTurboV25OptionsSchema,
} as const;

export type ElevenLabsAudioModelId = keyof typeof elevenLabsAudioModels;
