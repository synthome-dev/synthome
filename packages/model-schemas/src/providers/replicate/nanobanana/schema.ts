import { z } from "zod";

// Import provider config schema properly to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

const nanobananaBaseSchema = z.object({
  // Required
  prompt: z
    .string()
    .describe("A text description of the image you want to generate"),

  // Optional image inputs for image-to-image generation
  image_input: z
    .array(z.string().url())
    .optional()
    .describe(
      "Input images to transform or use as reference (supports multiple images)",
    ),

  // Optional aspect ratio
  aspect_ratio: z
    .string()
    .optional()
    .describe("Aspect ratio of the generated image"),

  // Optional output format
  output_format: z
    .enum(["jpg", "png"])
    .optional()
    .describe("Format of the output image"),
});

export const nanobananaRawOptionsSchema = nanobananaBaseSchema;

export const nanobananaOptionsSchema =
  nanobananaBaseSchema.merge(providerConfigSchema);

export type NanobananaRawOptions = z.infer<typeof nanobananaRawOptionsSchema>;
export type NanobananaOptions = z.infer<typeof nanobananaOptionsSchema>;

export const nanobananaImageModels = {
  "google/nano-banana": nanobananaOptionsSchema,
} as const;

export type NanobananaImageModelId = keyof typeof nanobananaImageModels;
