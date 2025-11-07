import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { VideoProviderFactory } from "@repo/providers";
import {
  getModelInfo,
  getModelCapabilities,
  parseModelOptions,
  replicateMappings,
  unifiedBackgroundRemovalOptionsSchema,
  type UnifiedBackgroundRemovalOptions,
} from "@repo/model-schemas";
import { db, executionJobs, eq } from "@repo/db";

export class RemoveBackgroundJob extends BasePipelineJob {
  readonly type: string = "removeBackground";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(
        `[RemoveBackgroundJob] Removing background with params:`,
        params,
      );

      const { modelId, video, outputType, ...otherParams } = params as {
        modelId?: string;
        video?: string;
        outputType?: string;
        [key: string]: any;
      };

      if (!modelId) {
        throw new Error("modelId is required in params");
      }

      // Get video URL from dependencies if not provided directly
      let videoUrl = video;
      if (!videoUrl && dependencies && Object.keys(dependencies).length > 0) {
        console.log(
          `[RemoveBackgroundJob] Extracting video URL from dependencies`,
        );
        const dependencyResults = Object.values(dependencies);
        const depResult = dependencyResults[0];

        if (
          depResult &&
          typeof depResult === "object" &&
          "outputs" in depResult
        ) {
          const outputs = (depResult as any).outputs;
          if (Array.isArray(outputs) && outputs.length > 0 && outputs[0].url) {
            videoUrl = outputs[0].url;
          }
        } else if (
          depResult &&
          typeof depResult === "object" &&
          "url" in depResult
        ) {
          videoUrl = (depResult as any).url;
        }
      }

      if (!videoUrl) {
        throw new Error(
          "video is required either in params or from dependencies",
        );
      }

      console.log(`[RemoveBackgroundJob] Using video URL: ${videoUrl}`);

      const modelInfo = getModelInfo(modelId);
      if (!modelInfo) {
        throw new Error(`Unknown model: ${modelId}`);
      }

      // Build unified params
      const unifiedParams: UnifiedBackgroundRemovalOptions = {
        video: videoUrl,
        outputType: (outputType as any) || "green-screen",
      };

      // Validate unified params
      const validatedUnified =
        unifiedBackgroundRemovalOptionsSchema.parse(unifiedParams);

      console.log(
        `[RemoveBackgroundJob] Validated unified params:`,
        validatedUnified,
      );

      // Get mapping for this model
      const mapping =
        replicateMappings[modelId as keyof typeof replicateMappings];

      if (!mapping) {
        throw new Error(`No parameter mapping found for model: ${modelId}`);
      }

      // Convert unified params to provider-specific params
      const providerParams = (mapping as any).toProviderOptions(
        validatedUnified,
      );

      console.log(
        `[RemoveBackgroundJob] Converted to provider params:`,
        providerParams,
      );

      // Validate provider parameters against model schema
      let validatedParams: Record<string, unknown>;
      try {
        validatedParams = parseModelOptions(modelId, {
          ...providerParams,
          ...otherParams,
        });
        console.log(
          `[RemoveBackgroundJob] Validated params for ${modelId}:`,
          validatedParams,
        );
      } catch (error) {
        const validationError =
          error instanceof Error ? error.message : "Unknown validation error";
        throw new Error(
          `Parameter validation failed for model ${modelId}: ${validationError}`,
        );
      }

      // Get model capabilities to determine waiting strategy
      const capabilities = getModelCapabilities(modelId);
      const waitingStrategy = capabilities.defaultStrategy;

      console.log(
        `[RemoveBackgroundJob] Using ${waitingStrategy} strategy for model ${modelId}`,
      );

      await this.updateJobProgress(jobRecordId, "calling provider API", 10);

      const provider = VideoProviderFactory.getProvider(modelInfo.provider);

      // Build webhook URL if provider supports webhooks
      const webhookUrl = capabilities.supportsWebhooks
        ? `${process.env.API_BASE_URL || "http://localhost:3000"}/api/webhooks/job/${jobRecordId}`
        : undefined;

      console.log(
        `[RemoveBackgroundJob] Webhook URL: ${webhookUrl} (API_BASE_URL: ${process.env.API_BASE_URL})`,
      );

      // Start background removal (non-blocking)
      const generationStart = await provider.startGeneration(
        modelId,
        validatedParams,
        webhookUrl,
      );

      console.log(
        `[RemoveBackgroundJob] Started provider job: ${generationStart.providerJobId}`,
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
        `[RemoveBackgroundJob] Job ${jobRecordId} now waiting via ${waitingStrategy}. ` +
          `Provider job ID: ${generationStart.providerJobId}`,
      );

      // Job stays in "processing" state
      // Completion will be handled by webhook or polling worker
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[RemoveBackgroundJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
