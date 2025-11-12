import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { VideoProviderFactory } from "@repo/providers";
import {
  getModelInfo,
  parseModelPolling,
  parseModelOptions,
} from "@repo/model-schemas";

export class GenerateImageJob extends BasePipelineJob {
  readonly type: string = "generateImage";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[GenerateImageJob] Generating image with params:`, params);

      // Fetch execution to get provider API keys
      const execution = await this.getExecutionWithProviderKeys(jobRecordId);

      const { modelId, ...providerParams } = params as {
        modelId?: string;
        [key: string]: any;
      };
      if (!modelId) {
        throw new Error("modelId is required in params");
      }

      const modelInfo = getModelInfo(modelId);
      if (!modelInfo) {
        throw new Error(`Unknown model: ${modelId}`);
      }

      // Validate and parse provider parameters against model schema
      let validatedParams: Record<string, unknown>;
      try {
        validatedParams = parseModelOptions(modelId, providerParams);
        console.log(
          `[GenerateImageJob] Validated params for ${modelId}:`,
          validatedParams,
        );
      } catch (error) {
        const validationError =
          error instanceof Error ? error.message : "Unknown validation error";
        throw new Error(
          `Parameter validation failed for model ${modelId}: ${validationError}`,
        );
      }

      console.log(
        `[GenerateImageJob] Using synchronous polling for model ${modelId}`,
      );

      await this.updateJobProgress(jobRecordId, "calling provider API", 10);

      // Get client's API key for this provider (if provided)
      const providerApiKey =
        execution.providerApiKeys?.[
          modelInfo.provider as keyof typeof execution.providerApiKeys
        ];

      const provider = VideoProviderFactory.getProvider(
        modelInfo.provider,
        providerApiKey,
      );

      // Start image generation (no webhook needed - we'll poll synchronously)
      const generationStart = await provider.startGeneration(
        modelId,
        validatedParams,
      );

      console.log(
        `[GenerateImageJob] Started provider job: ${generationStart.providerJobId}`,
      );

      await this.updateJobProgress(jobRecordId, "polling for completion", 30);

      // Poll synchronously until complete (images are fast: 2-10s)
      const POLL_INTERVAL = 2000; // 2 seconds
      const MAX_ATTEMPTS = 60; // 2 minutes timeout
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        attempts++;

        const progressPercentage = Math.min(
          30 + Math.floor((attempts / MAX_ATTEMPTS) * 60),
          90,
        );
        await this.updateJobProgress(
          jobRecordId,
          `polling (attempt ${attempts}/${MAX_ATTEMPTS})`,
          progressPercentage,
        );

        // Check status via provider
        const status = await provider.getJobStatus(
          generationStart.providerJobId,
        );

        if (status.status === "failed") {
          throw new Error(status.error || "Image generation failed");
        }

        if (status.status === "completed") {
          // For images, we need the raw response to parse with parseReplicateImage
          if (!provider.getRawJobResponse) {
            throw new Error("Provider does not support raw response retrieval");
          }

          const rawResponse = await provider.getRawJobResponse(
            generationStart.providerJobId,
          );

          // Parse the raw response using the model's polling parser
          const parsedResult = parseModelPolling(modelId, rawResponse);

          console.log(
            `[GenerateImageJob] Image generated successfully:`,
            parsedResult,
          );

          await this.updateJobProgress(jobRecordId, "completed", 100);
          await this.completeJob(jobRecordId, parsedResult);
          return;
        }

        // Still processing, continue polling
      }

      throw new Error(
        `Image generation timeout after ${MAX_ATTEMPTS} attempts`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[GenerateImageJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
