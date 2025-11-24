import { z } from "zod";

// Define inline to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export const incrediblyFastWhisperRawOptionsSchema = z.object({
  audio: z.string().url().describe("Audio file URL to transcribe"),
  task: z
    .enum(["transcribe", "translate"])
    .optional()
    .default("transcribe")
    .describe("Task to perform: transcribe or translate to English"),
  language: z
    .string()
    .optional()
    .default("None")
    .describe("Language of the audio. Use 'None' for auto-detection"),
  timestamp: z
    .enum(["chunk", "word"])
    .optional()
    .default("word")
    .describe("Timestamp granularity: chunk (sentence) or word level"),
  batch_size: z
    .number()
    .int()
    .optional()
    .default(64)
    .describe("Batch size for inference"),
  diarization: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable speaker diarization"),
  hf_token: z
    .string()
    .optional()
    .describe(
      "HuggingFace token for diarization (required if diarization=true)",
    ),
});

export type IncrediblyFastWhisperRawOptions = z.infer<
  typeof incrediblyFastWhisperRawOptionsSchema
>;

const incrediblyFastWhisperOptionsSchema =
  incrediblyFastWhisperRawOptionsSchema.merge(providerConfigSchema);

export const incrediblyFastWhisperModels = {
  "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c":
    incrediblyFastWhisperOptionsSchema,
} as const;

export type IncrediblyFastWhisperModelId =
  keyof typeof incrediblyFastWhisperModels;
