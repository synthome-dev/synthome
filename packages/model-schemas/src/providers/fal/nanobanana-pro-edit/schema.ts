import { z } from "zod";

/**
 * fal-ai/nano-banana-pro/edit - Google's Nano Banana Pro image editing model
 * Endpoint: https://fal.run/fal-ai/nano-banana-pro/edit
 *
 * Image-to-image editing with multi-image support
 */
export const nanobananaProEditRawOptionsSchema = z.object({
  /**
   * The prompt for image editing (required)
   * @example "make a photo of the man driving the car down the california coastline"
   */
  prompt: z.string().describe("The prompt for image editing"),

  /**
   * The URLs of the images to use for editing (required)
   * @example ["https://example.com/input1.png", "https://example.com/input2.png"]
   */
  image_urls: z
    .array(z.string().url())
    .min(1)
    .describe("The URLs of the images to use for editing"),

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
   * The aspect ratio of the generated image (includes "auto" option)
   * @default "auto"
   */
  aspect_ratio: z
    .enum([
      "auto",
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

export type NanobananaProEditRawOptions = z.infer<
  typeof nanobananaProEditRawOptionsSchema
>;

export const nanobananaProEditImageModels = {
  "fal-ai/nano-banana-pro/edit": nanobananaProEditRawOptionsSchema,
} as const;

export type NanobananaProEditImageModelId =
  keyof typeof nanobananaProEditImageModels;
