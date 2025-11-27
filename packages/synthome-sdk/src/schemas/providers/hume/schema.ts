import { z } from "zod";

// Provider config schema
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

// Hume TTS base schema
const humeTtsBaseSchema = z.object({
  // Required: input text to synthesize
  text: z
    .string()
    .min(1)
    .describe("The input text to be synthesized into speech"),

  // Optional: voice specification - pass through directly to Hume API
  voice: z
    .union([
      z.object({
        id: z.string(),
        provider: z.enum(["HUME_AI", "CUSTOM_VOICE"]).optional(),
      }),
      z.object({
        name: z.string(),
        provider: z.enum(["HUME_AI", "CUSTOM_VOICE"]).optional(),
      }),
    ])
    .optional()
    .describe(
      "Voice specification - either { id: 'uuid' } for voice IDs or { name: 'Voice Name' } for voice names, with optional provider ('HUME_AI' for library voices, 'CUSTOM_VOICE' for custom voices)",
    ),

  // Optional: natural language description of how speech should sound
  description: z
    .string()
    .optional()
    .describe(
      "Natural language instructions for tone, intonation, pacing, and accent. With voice: acts as acting directions (keep under 100 chars). Without voice: serves as voice generation prompt",
    ),

  // Optional: speed control
  speed: z
    .number()
    .min(0.5)
    .max(2.0)
    .optional()
    .describe(
      "Speed multiplier for synthesized speech. Values between 0.75-1.5 recommended for stability. Range: 0.5-2.0",
    ),

  // Optional: trailing silence
  trailingSilence: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe("Duration of trailing silence in seconds to add after utterance"),

  // Optional: audio format (FIXED: removed .optional() before .default())
  format: z
    .enum(["mp3", "wav", "pcm"])
    .default("mp3")
    .optional()
    .describe("Output audio format. Default: mp3"),

  // Optional: Octave version
  version: z
    .enum(["1", "2"])
    .optional()
    .describe(
      "Octave model version. Version 2 requires a voice to be specified. Omit for automatic routing",
    ),

  // Optional: number of generations
  numGenerations: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe(
      "Number of audio generations to produce. Enables faster batch processing with prosody continuation",
    ),
});

export const humeTtsRawOptionsSchema = humeTtsBaseSchema;

export const humeTtsOptionsSchema =
  humeTtsBaseSchema.merge(providerConfigSchema);

export type HumeTtsRawOptions = z.infer<typeof humeTtsRawOptionsSchema>;
export type HumeTtsOptions = z.infer<typeof humeTtsOptionsSchema>;

export const humeAudioModels = {
  "hume/tts": humeTtsOptionsSchema,
} as const;

export type HumeAudioModelId = keyof typeof humeAudioModels;
