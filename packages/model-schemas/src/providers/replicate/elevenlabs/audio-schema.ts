import { z } from "zod";

// Import provider config schema properly to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

const elevenLabsTurboV25BaseSchema = z.object({
  // Required
  text: z
    .string()
    .describe("Text to convert to speech (max 40,000 characters)"),

  // Voice and style options
  voice: z
    .string()
    .optional()
    .describe(
      "Voice to use for speech generation. Default: 'Adam'. Popular options: Adam, Antoni, Arnold, Bella, Domi, Elli, Josh, Rachel, Sam",
    ),
  stability: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Voice stability/consistency. Higher values = more stable/consistent. Range: 0.0-1.0",
    ),
  similarity_boost: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Voice similarity enhancement. Higher values = closer to original voice. Range: 0.0-1.0",
    ),
  style: z
    .number()
    .min(0.0)
    .max(1.0)
    .optional()
    .describe(
      "Style exaggeration. Higher values = more expressive/exaggerated. Range: 0.0-1.0",
    ),

  // Speech control
  speed: z
    .number()
    .min(0.25)
    .max(4.0)
    .optional()
    .describe("Speech speed multiplier. Range: 0.25-4.0. Default: 1.0"),

  // Language
  language_code: z
    .string()
    .optional()
    .describe(
      "Language code (e.g., 'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar'). Supports 32 languages. If not specified, auto-detected from text",
    ),

  // Context for better pronunciation
  previous_text: z
    .string()
    .optional()
    .describe(
      "Text that comes before this segment (for better context and pronunciation)",
    ),
  next_text: z
    .string()
    .optional()
    .describe(
      "Text that comes after this segment (for better context and pronunciation)",
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
