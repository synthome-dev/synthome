import {
  googleCloudCapabilities,
  parseGoogleCloudPolling,
  parseGoogleCloudWebhook,
} from "./providers/google-cloud/index.js";

export const googleCloudSchemas = {} as const;

export type GoogleCloudModelId = keyof typeof googleCloudSchemas;

export interface GoogleCloudModels {}

export {
  googleCloudCapabilities, parseGoogleCloudPolling, parseGoogleCloudWebhook
};
