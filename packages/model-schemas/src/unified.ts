import { z } from "zod";

// Video Generation unified schema
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

// Background Removal unified schema
export const unifiedBackgroundRemovalOptionsSchema = z.object({
  video: z.string().url(),
  outputType: z
    .enum(["green-screen", "alpha-mask", "foreground-mask"])
    .optional(),
});

export type UnifiedBackgroundRemovalOptions = z.infer<
  typeof unifiedBackgroundRemovalOptionsSchema
>;

// Image Generation unified schema
export const unifiedImageOptionsSchema = z.object({
  prompt: z.string(),
  imageInputs: z.array(z.string().url()).optional(), // Input images for image-to-image generation
  aspectRatio: z.string().optional(), // Aspect ratio (e.g., "16:9", "1:1", etc.)
  outputFormat: z.enum(["jpg", "png", "webp"]).optional(), // Output format
  seed: z.number().int().optional(),
});

export type UnifiedImageOptions = z.infer<typeof unifiedImageOptionsSchema>;

// Generic mapping interface
export interface ParameterMapping<TUnified, TProviderOptions> {
  toProviderOptions: (unified: TUnified) => TProviderOptions;
  fromProviderOptions: (provider: TProviderOptions) => Partial<TUnified>;
}

// Backward compatibility - existing video generation mappings
export interface VideoGenerationMapping<TProviderOptions>
  extends ParameterMapping<UnifiedVideoOptions, TProviderOptions> {}

// Background removal mappings
export interface BackgroundRemovalMapping<TProviderOptions>
  extends ParameterMapping<UnifiedBackgroundRemovalOptions, TProviderOptions> {}

// Image generation mappings
export interface ImageGenerationMapping<TProviderOptions>
  extends ParameterMapping<UnifiedImageOptions, TProviderOptions> {}
