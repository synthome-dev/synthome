import { z } from "zod";

// Import provider config schema properly to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

const backgroundRemoverBaseSchema = z.object({
  // Required
  image: z.string().url().describe("Input image URL"),
});

export const backgroundRemoverRawOptionsSchema = backgroundRemoverBaseSchema;

export const backgroundRemoverOptionsSchema =
  backgroundRemoverBaseSchema.merge(providerConfigSchema);

export type BackgroundRemoverRawOptions = z.infer<
  typeof backgroundRemoverRawOptionsSchema
>;
export type BackgroundRemoverOptions = z.infer<
  typeof backgroundRemoverOptionsSchema
>;

export const imageBackgroundRemoverModels = {
  "codeplugtech/background_remover": backgroundRemoverOptionsSchema,
} as const;

export type ImageBackgroundRemoverModelId =
  keyof typeof imageBackgroundRemoverModels;
