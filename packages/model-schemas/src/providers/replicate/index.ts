import { z } from "zod";

export const providerConfigSchema = z.object({
  apiKey: z.string().optional(),
});

export * from "./seedance/index.js";
