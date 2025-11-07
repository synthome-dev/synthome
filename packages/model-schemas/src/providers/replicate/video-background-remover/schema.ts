import { z } from "zod";

// Define inline to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export const naterawVideoBackgroundRemoverRawOptionsSchema = z.object({
  video: z.string().url(),
});

export type NaterawVideoBackgroundRemoverRawOptions = z.infer<
  typeof naterawVideoBackgroundRemoverRawOptionsSchema
>;

const naterawVideoBackgroundRemoverOptionsSchema =
  naterawVideoBackgroundRemoverRawOptionsSchema.merge(providerConfigSchema);

export const videoBackgroundRemoverModels = {
  "nateraw/video-background-remover":
    naterawVideoBackgroundRemoverOptionsSchema,
} as const;

export type VideoBackgroundRemoverModelId =
  keyof typeof videoBackgroundRemoverModels;
