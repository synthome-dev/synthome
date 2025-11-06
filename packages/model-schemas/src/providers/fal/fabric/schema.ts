import { z } from "zod";

/**
 * VEED Fabric 1.0 Fast - Image-to-video with audio (talking head)
 * Endpoint: https://fal.run/veed/fabric-1.0/fast
 *
 * Converts an image and audio into a talking video
 */
export const fabric1FastRawOptionsSchema = z
  .object({
    /**
     * URL to the input image (unified param)
     */
    image: z.string().url().optional(),

    /**
     * URL to the audio file (unified param)
     */
    audio: z.string().url().optional(),

    /**
     * URL to the input image (provider-specific param)
     * @example "https://v3.fal.media/files/koala/NLVPfOI4XL1cWT2PmmqT3_Hope.png"
     */
    image_url: z.string().url().optional(),

    /**
     * URL to the audio file (provider-specific param)
     * @example "https://v3.fal.media/files/elephant/Oz_g4AwQvXtXpUHL3Pa7u_Hope.mp3"
     */
    audio_url: z.string().url().optional(),

    /**
     * Output video resolution
     * @default "720p"
     */
    resolution: z.enum(["720p", "480p"]),
  })
  .refine((data) => data.image || data.image_url, {
    message: "Either 'image' or 'image_url' is required",
  })
  .refine((data) => data.audio || data.audio_url, {
    message: "Either 'audio' or 'audio_url' is required",
  });

export type Fabric1FastRawOptions = z.infer<typeof fabric1FastRawOptionsSchema>;

/**
 * VEED Fabric 1.0 - Image-to-video with audio (talking head)
 * Endpoint: https://fal.run/veed/fabric-1.0
 *
 * Same as fast version, converts an image and audio into a talking video
 */
export const fabric1RawOptionsSchema = fabric1FastRawOptionsSchema;

export type Fabric1RawOptions = z.infer<typeof fabric1RawOptionsSchema>;

export const fabricModels = {
  "veed/fabric-1.0": fabric1RawOptionsSchema,
  "veed/fabric-1.0/fast": fabric1FastRawOptionsSchema,
} as const;

export type FabricModelId = keyof typeof fabricModels;
