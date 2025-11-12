import { z } from "zod";

export const seedance1ProRawOptionsSchema = z.object({
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  aspect_ratio: z
    .enum(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"])
    .optional(),
  seed: z.number().int().optional(),
  image: z.string().url().optional(),
  prompt: z.string(),
  duration: z.number().int().optional(),
  camera_fixed: z.boolean().optional(),
  last_frame_image: z.string().url().optional(),
});

export type Seedance1ProRawOptions = z.infer<
  typeof seedance1ProRawOptionsSchema
>;

export const seedanceModels = {
  "bytedance/seedance-1-pro": seedance1ProRawOptionsSchema,
} as const;

export type SeedanceModelId = keyof typeof seedanceModels;
