import { z } from "zod";

// Define inline to avoid circular dependency
const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export const robustVideoMattingRawOptionsSchema = z.object({
  input_video: z.string().url(),
  output_type: z
    .enum(["green-screen", "alpha-mask", "foreground-mask"])
    .optional()
    .default("green-screen"),
});

export type RobustVideoMattingRawOptions = z.infer<
  typeof robustVideoMattingRawOptionsSchema
>;

const robustVideoMattingOptionsSchema =
  robustVideoMattingRawOptionsSchema.merge(providerConfigSchema);

export const videoMattingModels = {
  "arielreplicate/robust_video_matting": robustVideoMattingOptionsSchema,
} as const;

export type VideoMattingModelId = keyof typeof videoMattingModels;


const e = () => {
  
}