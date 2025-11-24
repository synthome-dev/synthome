import { z } from "zod";
import {
  type FalModelId,
  falModelCapabilities,
  parseFalPolling,
  parseFalWebhook,
  parseFalImage,
  falSchemas,
} from "./fal.js";
import { type GoogleCloudModelId } from "./google-cloud.js";
import {
  parseReplicateAudio,
  parseReplicateImage,
  parseReplicatePolling,
  parseReplicateWebhook,
  parseReplicateTranscript,
  replicateModelCapabilities,
  replicateSchemas,
  type ReplicateModelId,
} from "./replicate.js";
import {
  humeModelCapabilities,
  humeSchemas,
  parseHumeAudio,
  type HumeModelId,
} from "./hume.js";
import {
  elevenLabsModelCapabilities,
  elevenLabsSchemas,
  parseElevenLabsAudio,
  type ElevenLabsModelId,
} from "./elevenlabs.js";
import type {
  MediaType,
  PollingParser,
  ProviderCapabilities,
  WebhookParser,
} from "./webhook-types.js";

export type VideoProvider =
  | "replicate"
  | "fal"
  | "google-cloud"
  | "hume"
  | "elevenlabs";

export interface ModelRegistryEntry {
  provider: VideoProvider;
  mediaType: MediaType;
  schema: z.ZodType;
  webhookParser: WebhookParser;
  pollingParser: PollingParser;
  capabilities: ProviderCapabilities;
  providerModelId?: string; // Optional: full model version/identifier for the provider (e.g., Replicate version hash)
}

type AllModelIds =
  | ReplicateModelId
  | FalModelId
  | GoogleCloudModelId
  | HumeModelId
  | ElevenLabsModelId;

export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["bytedance/seedance-1-pro"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["bytedance/seedance-1-pro"],
  },
  "minimax/video-01": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["minimax/video-01"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateModelCapabilities["minimax/video-01"],
  },
  "bytedance/seedream-4": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["bytedance/seedream-4"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["bytedance/seedream-4"],
  },
  "google/nano-banana": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["google/nano-banana"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["google/nano-banana"],
  },
  "google/nano-banana-pro": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["google/nano-banana-pro"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["google/nano-banana-pro"],
  },
  "arielreplicate/robust_video_matting": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["arielreplicate/robust_video_matting"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities:
      replicateModelCapabilities["arielreplicate/robust_video_matting"],
    providerModelId:
      "73d2128a371922d5d1abf0712a1d974be0e4e2358cc1218e4e34714767232bac",
  },
  "nateraw/video-background-remover": {
    provider: "replicate",
    mediaType: "video",
    schema: replicateSchemas["nateraw/video-background-remover"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities:
      replicateModelCapabilities["nateraw/video-background-remover"],
    providerModelId:
      "ac5c138171b04413a69222c304f67c135e259d46089fc70ef12da685b3c604aa",
  },
  "veed/fabric-1.0": {
    provider: "fal",
    mediaType: "video",
    schema: falSchemas["veed/fabric-1.0"],
    webhookParser: parseFalWebhook,
    pollingParser: parseFalPolling,
    capabilities: falModelCapabilities["veed/fabric-1.0"],
  },
  "veed/fabric-1.0/fast": {
    provider: "fal",
    mediaType: "video",
    schema: falSchemas["veed/fabric-1.0/fast"],
    webhookParser: parseFalWebhook,
    pollingParser: parseFalPolling,
    capabilities: falModelCapabilities["veed/fabric-1.0/fast"],
  },
  "fal-ai/nano-banana": {
    provider: "fal",
    mediaType: "image",
    schema: falSchemas["fal-ai/nano-banana"],
    webhookParser: parseFalImage,
    pollingParser: parseFalImage,
    capabilities: falModelCapabilities["fal-ai/nano-banana"],
  },
  "fal-ai/nano-banana-pro": {
    provider: "fal",
    mediaType: "image",
    schema: falSchemas["fal-ai/nano-banana-pro"],
    webhookParser: parseFalImage,
    pollingParser: parseFalImage,
    capabilities: falModelCapabilities["fal-ai/nano-banana-pro"],
  },
  "fal-ai/nano-banana-pro/edit": {
    provider: "fal",
    mediaType: "image",
    schema: falSchemas["fal-ai/nano-banana-pro/edit"],
    webhookParser: parseFalImage,
    pollingParser: parseFalImage,
    capabilities: falModelCapabilities["fal-ai/nano-banana-pro/edit"],
  },
  "codeplugtech/background_remover": {
    provider: "replicate",
    mediaType: "image",
    schema: replicateSchemas["codeplugtech/background_remover"],
    webhookParser: parseReplicateImage,
    pollingParser: parseReplicateImage,
    capabilities: replicateModelCapabilities["codeplugtech/background_remover"],
  },
  "hume/tts": {
    provider: "hume",
    mediaType: "audio",
    schema: humeSchemas["hume/tts"],
    webhookParser: parseHumeAudio,
    pollingParser: parseHumeAudio,
    capabilities: humeModelCapabilities["hume/tts"],
  },
  "elevenlabs/turbo-v2.5": {
    provider: "elevenlabs",
    mediaType: "audio",
    schema: elevenLabsSchemas["elevenlabs/turbo-v2.5"],
    webhookParser: parseElevenLabsAudio,
    pollingParser: parseElevenLabsAudio,
    capabilities: elevenLabsModelCapabilities["elevenlabs/turbo-v2.5"],
  },
  "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e":
    {
      provider: "replicate",
      mediaType: "transcript", // Use the new media type
      schema:
        replicateSchemas[
          "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e"
        ],
      webhookParser: parseReplicateTranscript,
      pollingParser: parseReplicateTranscript,
      capabilities:
        replicateModelCapabilities[
          "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e"
        ],
    },
  "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c":
    {
      provider: "replicate",
      mediaType: "transcript",
      schema:
        replicateSchemas[
          "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c"
        ],
      webhookParser: parseReplicateTranscript,
      pollingParser: parseReplicateTranscript,
      capabilities:
        replicateModelCapabilities[
          "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c"
        ],
    },
};

export function getModelInfo(modelId: string): ModelRegistryEntry | undefined {
  return modelRegistry[modelId as AllModelIds];
}

export function validateModelOptions(
  modelId: string,
  options: unknown,
): boolean {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const result = modelInfo.schema.safeParse(options);
  return result.success;
}

export function parseModelOptions<T>(modelId: string, options: unknown): T {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.schema.parse(options) as T;
}

/**
 * Parse a webhook payload for a specific model
 */
export function parseModelWebhook(modelId: string, payload: unknown) {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.webhookParser(payload);
}

/**
 * Parse a polling response for a specific model
 */
export function parseModelPolling(modelId: string, response: unknown) {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.pollingParser(response);
}

/**
 * Get provider capabilities for a model
 */
export function getModelCapabilities(modelId: string): ProviderCapabilities {
  const modelInfo = getModelInfo(modelId);
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return modelInfo.capabilities;
}

/**
 * Get the media type (video/audio/image) for a model
 */
export function getModelMediaType(modelId: string): MediaType | undefined {
  const modelInfo = getModelInfo(modelId);
  return modelInfo?.mediaType;
}
