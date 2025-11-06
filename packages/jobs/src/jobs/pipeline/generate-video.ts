import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { VideoProviderFactory } from "@repo/providers";
import {
  getModelInfo,
  getModelCapabilities,
  parseModelOptions,
} from "@repo/model-schemas";
import { db, executionJobs, eq } from "@repo/db";

export class GenerateVideoJob extends BasePipelineJob {
  readonly type: string = "generate";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[GenerateVideoJob] Generating video with params:`, params);

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
          `[GenerateVideoJob] Validated params for ${modelId}:`,
          validatedParams,
        );
      } catch (error) {
        const validationError =
          error instanceof Error ? error.message : "Unknown validation error";
        throw new Error(
          `Parameter validation failed for model ${modelId}: ${validationError}`,
        );
      }

      // For Fabric models, convert image/audio to image_url/audio_url for provider API
      let providerApiParams = validatedParams;
      if (modelId.includes("fabric")) {
        const { image, audio, ...rest } = validatedParams;
        providerApiParams = {
          ...rest,
          image_url: (validatedParams.image_url as string) || (image as string),
          audio_url: (validatedParams.audio_url as string) || (audio as string),
        };
        console.log(
          `[GenerateVideoJob] Mapped params for Fabric:`,
          providerApiParams,
        );
      }

      // Get model capabilities to determine waiting strategy
      const capabilities = getModelCapabilities(modelId);
      const waitingStrategy = capabilities.defaultStrategy;

      console.log(
        `[GenerateVideoJob] Using ${waitingStrategy} strategy for model ${modelId}`,
      );

      await this.updateJobProgress(jobRecordId, "calling provider API", 10);

      const provider = VideoProviderFactory.getProvider(modelInfo.provider);

      // Build webhook URL if provider supports webhooks
      const webhookUrl = capabilities.supportsWebhooks
        ? `${process.env.API_BASE_URL || "http://localhost:3000"}/api/webhooks/job/${jobRecordId}`
        : undefined;

      console.log(
        `[GenerateVideoJob] Webhook URL: ${webhookUrl} (API_BASE_URL: ${process.env.API_BASE_URL})`,
      );

      // Start generation (non-blocking)
      const generationStart = await provider.startGeneration(
        modelId,
        providerApiParams,
        webhookUrl,
      );

      console.log(
        `[GenerateVideoJob] Started provider job: ${generationStart.providerJobId}`,
      );

      // Calculate next poll time for polling strategy
      const nextPollAt =
        waitingStrategy === "polling"
          ? new Date(Date.now() + 5000) // Poll after 5 seconds
          : undefined;

      // Update job record with provider job info
      await db
        .update(executionJobs)
        .set({
          providerJobId: generationStart.providerJobId,
          waitingStrategy,
          nextPollAt,
          metadata: {
            ...params,
            modelId, // Store modelId in metadata for webhook/polling parsing
            providerJobId: generationStart.providerJobId,
          },
        })
        .where(eq(executionJobs.id, jobRecordId));

      await this.updateJobProgress(
        jobRecordId,
        waitingStrategy === "webhook"
          ? "waiting for webhook"
          : "waiting for polling",
        20,
      );

      console.log(
        `[GenerateVideoJob] Job ${jobRecordId} now waiting via ${waitingStrategy}. ` +
          `Provider job ID: ${generationStart.providerJobId}`,
      );

      // Job stays in "processing" state
      // Completion will be handled by webhook or polling worker
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[GenerateVideoJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
