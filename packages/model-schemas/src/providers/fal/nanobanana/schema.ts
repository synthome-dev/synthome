import { z } from "zod";

/**
 * fal-ai/nano-banana - Google's Gemini 2.5 Flash Image generation and editing model
 * Endpoint: https://fal.run/fal-ai/nano-banana
 *
 * Text-to-image and image-to-image generation with multi-image support
 */
export const nanobananaRawOptionsSchema = z.object({
  /**
   * The text prompt to generate an image from (required)
   * @example "An action shot of a black lab swimming in a pool"
   */
  prompt: z.string().describe("The text prompt to generate an image from"),

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
});

export type NanobananaRawOptions = z.infer<typeof nanobananaRawOptionsSchema>;

export const nanobananaImageModels = {
  "fal-ai/nano-banana": nanobananaRawOptionsSchema,
} as const;

export type NanobananaImageModelId = keyof typeof nanobananaImageModels;
