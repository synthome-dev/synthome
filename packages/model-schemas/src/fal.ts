import {
  falCapabilities,
  parseFalPolling,
  parseFalWebhook,
} from "./providers/fal/index.js";

export const falSchemas = {} as const;

export type FalModelId = keyof typeof falSchemas;

export interface FalModels {}

export { falCapabilities, parseFalPolling, parseFalWebhook };
