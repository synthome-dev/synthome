import { z } from "zod";

/**
 * fal-ai/nano-banana-pro - Google's Nano Banana Pro (Gemini 3 Pro) image generation model
 * Endpoint: https://fal.run/fal-ai/nano-banana-pro
 *
 * Text-to-image generation with advanced typography and reasoning capabilities
 */
export const nanobananaProRawOptionsSchema = z.object({
  /**
   * The text prompt to generate an image from (required)
   * @example "An action shot of a black lab swimming in a pool"
   */
  prompt: z.string().describe("The text prompt to generate an image from"),

  /**
   * The number of images to generate
   * @default 1
   */
  num_images: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .describe("The number of images to generate"),

  /**
   * The aspect ratio of the generated image
   * @default "1:1"
   */
  aspect_ratio: z
    .enum([
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ])
    .optional()
    .describe("The aspect ratio of the generated image"),

  /**
   * The format of the generated image
   * @default "png"
   */
  output_format: z
    .enum(["jpeg", "png", "webp"])
    .optional()
    .describe("The format of the generated image"),

  /**
   * If true, returns data URI instead of URL
   * @default false
   */
  sync_mode: z
    .boolean()
    .optional()
    .describe("If true, returns data URI instead of URL"),

  /**
   * The resolution of the image to generate
   * @default "1K"
   */
  resolution: z
    .enum(["1K", "2K", "4K"])
    .optional()
    .describe("The resolution of the image to generate"),
});

export type NanobananaProRawOptions = z.infer<
  typeof nanobananaProRawOptionsSchema
>;

export const nanobananaProImageModels = {
  "fal-ai/nano-banana-pro": nanobananaProRawOptionsSchema,
} as const;

export type NanobananaProImageModelId = keyof typeof nanobananaProImageModels;
