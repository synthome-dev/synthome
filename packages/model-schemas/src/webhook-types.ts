/**
 * Shared types for webhook and polling response parsing
 */

export type MediaType = "video" | "audio" | "image";

export type WaitingStrategy = "webhook" | "polling";

export interface MediaOutput {
  type: MediaType;
  url: string;
  mimeType?: string;
  duration?: number; // For video/audio
  width?: number; // For video/image
  height?: number; // For video/image
}

/**
 * Result of parsing a webhook or polling response
 */
export interface WebhookParseResult {
  status: "completed" | "failed" | "processing";
  outputs?: MediaOutput[];
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base webhook parser function type
 */
export type WebhookParser = (payload: unknown) => WebhookParseResult;

/**
 * Base polling response parser function type
 */
export type PollingParser = (response: unknown) => WebhookParseResult;

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  supportsWebhooks: boolean;
  supportsPolling: boolean;
  defaultStrategy: WaitingStrategy;
}
