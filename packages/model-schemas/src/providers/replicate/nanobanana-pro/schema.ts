import { z } from "zod";

// Import provider config schema properly to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

const nanobananaProBaseSchema = z.object({
  // Required
  prompt: z
    .string()
    .describe("A text description of the image you want to generate"),

  // Optional image inputs for image-to-image generation (supports up to 14 images)
  image_input: z
    .array(z.string().url())
    .max(14)
    .optional()
    .describe(
      "Input images to transform or use as reference (supports up to 14 images)",
    ),

  // Optional aspect ratio
  aspect_ratio: z
    .string()
    .optional()
    .describe("Aspect ratio of the generated image"),

  // Optional resolution (1K, 2K, 4K)
  resolution: z
    .enum(["1K", "2K", "4K"])
    .optional()
    .describe("Resolution of the generated image"),

  // Optional output format
  output_format: z.string().optional().describe("Format of the output image"),

  // Optional safety filter level
  safety_filter_level: z
    .enum(["block_low_and_above", "block_medium_and_above", "block_only_high"])
    .optional()
    .describe(
      "Safety filter level: block_low_and_above (strictest), block_medium_and_above (moderate), block_only_high (permissive)",
    ),
});

export const nanobananaProRawOptionsSchema = nanobananaProBaseSchema;

export const nanobananaProOptionsSchema =
  nanobananaProBaseSchema.merge(providerConfigSchema);

export type NanobananaProRawOptions = z.infer<
  typeof nanobananaProRawOptionsSchema
>;
export type NanobananaProOptions = z.infer<typeof nanobananaProOptionsSchema>;

export const nanobananaProImageModels = {
  "google/nano-banana-pro": nanobananaProOptionsSchema,
} as const;

export type NanobananaProImageModelId = keyof typeof nanobananaProImageModels;
