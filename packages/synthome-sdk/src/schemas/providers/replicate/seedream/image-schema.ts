import { z } from "zod";

// Import provider config schema properly to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

const seedream4BaseSchema = z.object({
  // Required
  prompt: z.string().describe("Text prompt for image generation"),

  // Size options
  size: z
    .enum(["1K", "2K", "4K", "custom"])
    .optional()
    .describe(
      "Image resolution: 1K (1024px), 2K (2048px), 4K (4096px), or 'custom' for specific dimensions",
    ),
  aspect_ratio: z
    .string()
    .optional()
    .describe(
      "Image aspect ratio. Use 'match_input_image' to automatically match input. Only used when size is not 'custom'",
    ),
  width: z
    .number()
    .int()
    .min(1024)
    .max(4096)
    .optional()
    .describe(
      "Custom image width (only used when size='custom'). Range: 1024-4096 pixels",
    ),
  height: z
    .number()
    .int()
    .min(1024)
    .max(4096)
    .optional()
    .describe(
      "Custom image height (only used when size='custom'). Range: 1024-4096 pixels",
    ),

  // Generation options
  sequential_image_generation: z
    .enum(["disabled", "auto"])
    .optional()
    .describe(
      "'disabled' generates a single image. 'auto' lets model decide whether to generate multiple related images",
    ),
  max_images: z
    .number()
    .int()
    .min(1)
    .max(15)
    .optional()
    .describe(
      "Maximum number of images to generate when sequential_image_generation='auto'. Range: 1-15",
    ),
  enhance_prompt: z
    .boolean()
    .optional()
    .describe(
      "Enable prompt enhancement for higher quality results (takes longer to generate)",
    ),

  // Image input for image-to-image generation
  image_input: z
    .array(z.string().url())
    .min(0)
    .max(10)
    .optional()
    .describe(
      "Input image(s) for image-to-image generation. List of 1-10 images for single or multi-reference generation",
    ),
});

export const seedream4RawOptionsSchema = seedream4BaseSchema
  .refine(
    (data) => {
      // If size is 'custom', both width and height must be provided
      if (data.size === "custom") {
        return data.width !== undefined && data.height !== undefined;
      }
      return true;
    },
    {
      message: "When size is 'custom', both width and height must be specified",
    },
  )
  .refine(
    (data) => {
      // If aspect_ratio is 'match_input_image', image_input must be provided
      if (data.aspect_ratio === "match_input_image") {
        return data.image_input !== undefined && data.image_input.length > 0;
      }
      return true;
    },
    {
      message:
        "When aspect_ratio is 'match_input_image', image_input must be provided",
    },
  );

export const seedream4OptionsSchema = seedream4BaseSchema
  .merge(providerConfigSchema)
  .refine(
    (data) => {
      if (data.size === "custom") {
        return data.width !== undefined && data.height !== undefined;
      }
      return true;
    },
    {
      message: "When size is 'custom', both width and height must be specified",
    },
  )
  .refine(
    (data) => {
      if (data.aspect_ratio === "match_input_image") {
        return data.image_input !== undefined && data.image_input.length > 0;
      }
      return true;
    },
    {
      message:
        "When aspect_ratio is 'match_input_image', image_input must be provided",
    },
  );

export type Seedream4RawOptions = z.infer<typeof seedream4RawOptionsSchema>;
export type Seedream4Options = z.infer<typeof seedream4OptionsSchema>;

export const seedreamImageModels = {
  "bytedance/seedream-4": seedream4OptionsSchema,
} as const;

export type SeedreamImageModelId = keyof typeof seedreamImageModels;
