import type { UnifiedVideoOptions } from "@repo/model-schemas";
import type {
  BaseGenerateOptions,
  ProviderConfig,
  VideoJob,
  VideoModel,
} from "../core/types.js";
import { getSynthomeApiKey } from "../utils/api-key.js";
import { mapUnifiedToProviderOptions } from "../utils/mapping.js";
import { pollJobStatus } from "../utils/polling.js";

export interface GenerateVideoOptions<TModelOptions extends ProviderConfig>
  extends BaseGenerateOptions {
  model: VideoModel<TModelOptions>;
}

export type GenerateVideoUnifiedOptions = GenerateVideoOptions<ProviderConfig> &
  UnifiedVideoOptions;

export type GenerateVideoProviderOptions<TModelOptions extends ProviderConfig> =
  GenerateVideoOptions<TModelOptions> & TModelOptions;

function isUnifiedOptions(
  options: GenerateVideoUnifiedOptions | GenerateVideoProviderOptions<any>
): options is GenerateVideoUnifiedOptions {
  return "prompt" in options;
}

async function createVideoJob<TModelOptions extends ProviderConfig>(
  options:
    | GenerateVideoUnifiedOptions
    | GenerateVideoProviderOptions<TModelOptions>
): Promise<VideoJob> {
  const { model, webhook } = options;

  // Get provider-specific API key
  const apiKey = model.options.apiKey || getApiKeyFromEnv(model.provider);

  if (!apiKey) {
    throw new Error(
      `API key not found for provider "${model.provider}". Please provide it in model options or set the environment variable.`
    );
  }

  // Get SYNTHOME_API_KEY for backend authorization
  const synthomeApiKey = getSynthomeApiKey();

  let providerOptions: unknown;

  if (isUnifiedOptions(options)) {
    const {
      prompt,
      duration,
      resolution,
      aspectRatio,
      seed,
      startImage,
      endImage,
      cameraMotion,
    } = options;

    const unifiedOpts: UnifiedVideoOptions = {
      prompt,
      duration,
      resolution,
      aspectRatio,
      seed,
      startImage,
      endImage,
      cameraMotion,
    };

    providerOptions = mapUnifiedToProviderOptions(
      model.provider,
      model.modelId,
      unifiedOpts
    );
  } else {
    providerOptions = { ...model.options, ...options };
  }

  const response = await fetch("/api/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${synthomeApiKey}`,
    },
    body: JSON.stringify({
      provider: model.provider,
      modelId: model.modelId,
      options: providerOptions,
      webhook: webhook?.url,
      webhookSecret: webhook?.secret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create video job: ${response.statusText}`);
  }

  const job = (await response.json()) as VideoJob;
  return job;
}

async function fetchJobStatus(jobId: string): Promise<VideoJob> {
  // Get SYNTHOME_API_KEY for backend authorization
  const synthomeApiKey = getSynthomeApiKey();

  const response = await fetch(`/api/video/status/${jobId}`, {
    headers: {
      Authorization: `Bearer ${synthomeApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${response.statusText}`);
  }

  return (await response.json()) as VideoJob;
}

function getApiKeyFromEnv(provider: string): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const envVarMap: Record<string, string> = {
    replicate: "REPLICATE_API_KEY",
    fal: "FAL_KEY",
    "google-cloud": "GOOGLE_CLOUD_API_KEY",
  };

  const envVar = envVarMap[provider];
  return envVar ? process.env[envVar] : undefined;
}

export async function generateVideo<TModelOptions extends ProviderConfig>(
  options:
    | GenerateVideoUnifiedOptions
    | GenerateVideoProviderOptions<TModelOptions>
): Promise<VideoJob> {
  const job = await createVideoJob(options);

  if (options.webhook) {
    return job;
  }

  return pollJobStatus(job.id, fetchJobStatus, options.onProgress);
}
