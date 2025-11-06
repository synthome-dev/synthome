import { z } from "zod";

export const unifiedVideoOptionsSchema = z.object({
  prompt: z.string(),
  duration: z.number().int().optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  aspectRatio: z
    .enum(["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "9:21"])
    .optional(),
  seed: z.number().int().optional(),
  image: z.string().url().optional(), // For image-to-video models
  startImage: z.string().url().optional(),
  endImage: z.string().url().optional(),
  audio: z.string().url().optional(), // For image-to-video models with audio (e.g., talking head)
  cameraMotion: z.enum(["fixed", "dynamic"]).optional(),
});

export type UnifiedVideoOptions = z.infer<typeof unifiedVideoOptionsSchema>;

export interface ParameterMapping<TProviderOptions> {
  toProviderOptions: (unified: UnifiedVideoOptions) => TProviderOptions;
  fromProviderOptions: (
    provider: TProviderOptions,
  ) => Partial<UnifiedVideoOptions>;
}
