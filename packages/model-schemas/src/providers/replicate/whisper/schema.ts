import { z } from "zod";

// Define inline to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export const whisperRawOptionsSchema = z.object({
  audio: z.string().url().describe("Audio file URL to transcribe"),
  model: z.string().optional().default("large-v3"),
  language: z.string().optional(),
  translate: z.boolean().optional().default(false),
  temperature: z.number().optional().default(0),
  transcription: z
    .enum(["plain text", "srt", "vtt"])
    .optional()
    .describe("Output format - leave empty for JSON with word timestamps"),
  word_timestamps: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include word-level timestamps in segments"),
  suppress_tokens: z.string().optional().default("-1"),
  logprob_threshold: z.number().optional().default(-1),
  no_speech_threshold: z.number().optional().default(0.6),
  condition_on_previous_text: z.boolean().optional().default(true),
  compression_ratio_threshold: z.number().optional().default(2.4),
  temperature_increment_on_fallback: z.number().optional().default(0.2),
});

export type WhisperRawOptions = z.infer<typeof whisperRawOptionsSchema>;

const whisperOptionsSchema =
  whisperRawOptionsSchema.merge(providerConfigSchema);

export const whisperModels = {
  "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e":
    whisperOptionsSchema,
} as const;

export type WhisperModelId = keyof typeof whisperModels;
