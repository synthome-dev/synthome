import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { VideoProviderFactory } from "@repo/providers";
import {
  getModelInfo,
  parseModelPolling,
  parseModelOptions,
} from "@repo/model-schemas";

export class RemoveImageBackgroundJob extends BasePipelineJob {
  readonly type: string = "removeImageBackground";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(
        `[RemoveImageBackgroundJob] Removing background with params:`,
        params,
      );

      // Fetch execution to get provider API keys
      const execution = await this.getExecutionWithProviderKeys(jobRecordId);

      const { modelId, image, _imageJobDependency, ...providerParams } =
        params as {
          modelId?: string;
          image?: string;
          _imageJobDependency?: string;
          [key: string]: any;
        };

      // Validate modelId
      if (!modelId) {
        throw new Error("modelId is required in params");
      }

      const modelInfo = getModelInfo(modelId);
      if (!modelInfo) {
        throw new Error(`Unknown model: ${modelId}`);
      }

      // Resolve image URL from direct URL or job dependency
      let imageUrl: string;
      if (_imageJobDependency) {
        console.log(
          `[RemoveImageBackgroundJob] Resolving image dependency: ${_imageJobDependency}`,
        );

        if (!dependencies || !dependencies[_imageJobDependency]) {
          throw new Error(`Dependency ${_imageJobDependency} not found`);
        }

        const dependencyResult = dependencies[_imageJobDependency];

        // Extract image URL from dependency result
        if (typeof dependencyResult === "string") {
          imageUrl = dependencyResult;
        } else if (dependencyResult && typeof dependencyResult === "object") {
          // Try common keys for image URLs
          const result = dependencyResult as Record<string, any>;
          imageUrl =
            result.image || result.url || result.output || result.imageUrl;

          if (!imageUrl) {
            throw new Error(
              `Could not extract image URL from dependency result: ${JSON.stringify(dependencyResult)}`,
            );
          }
        } else {
          throw new Error(
            `Invalid dependency result type: ${typeof dependencyResult}`,
          );
        }

        console.log(
          `[RemoveImageBackgroundJob] Resolved image URL: ${imageUrl}`,
        );
      } else if (image) {
        imageUrl = image;
      } else {
        throw new Error(
          "Either 'image' or '_imageJobDependency' must be provided",
        );
      }

      // Merge resolved image URL with provider params
      const fullParams = {
        ...providerParams,
        image: imageUrl,
      };

      // Validate and parse provider parameters against model schema
      let validatedParams: Record<string, unknown>;
      try {
        validatedParams = parseModelOptions(modelId, fullParams);
        console.log(
          `[RemoveImageBackgroundJob] Validated params for ${modelId}:`,
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
        `[RemoveImageBackgroundJob] Using synchronous polling for model ${modelId}`,
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

      // Start background removal (no webhook needed - we'll poll synchronously)
      const generationStart = await provider.startGeneration(
        modelId,
        validatedParams,
      );

      console.log(
        `[RemoveImageBackgroundJob] Started provider job: ${generationStart.providerJobId}`,
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
          throw new Error(status.error || "Background removal failed");
        }

        if (status.status === "completed") {
          // For images, we need the raw response to parse
          if (!provider.getRawJobResponse) {
            throw new Error("Provider does not support raw response retrieval");
          }

          const rawResponse = await provider.getRawJobResponse(
            generationStart.providerJobId,
          );

          // Parse the raw response using the model's polling parser
          const parsedResult = parseModelPolling(modelId, rawResponse);

          console.log(
            `[RemoveImageBackgroundJob] Background removed successfully`,
          );

          await this.updateJobProgress(jobRecordId, "completed", 100);
          await this.completeJob(jobRecordId, parsedResult);
          return;
        }

        // Still processing, continue polling
      }

      throw new Error(
        `Background removal timeout after ${MAX_ATTEMPTS} attempts`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[RemoveImageBackgroundJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
