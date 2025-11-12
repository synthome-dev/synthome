import { z } from "zod";

// Define inline to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export const minimaxVideo01RawOptionsSchema = z.object({
  prompt: z.string(),
  prompt_optimizer: z.boolean().optional(),
});

export type MinimaxVideo01RawOptions = z.infer<
  typeof minimaxVideo01RawOptionsSchema
>;

const minimaxVideo01OptionsSchema =
  minimaxVideo01RawOptionsSchema.merge(providerConfigSchema);

export const minimaxModels = {
  "minimax/video-01": minimaxVideo01OptionsSchema,
} as const;

export type MinimaxModelId = keyof typeof minimaxModels;
