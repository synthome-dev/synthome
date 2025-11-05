import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { getOrchestrator } from "../../orchestrator/execution-orchestrator.js";
import { VideoProviderFactory } from "@repo/providers";
import { storage } from "@repo/storage";
import { getModelInfo } from "@repo/model-schemas";

export class GenerateVideoJob extends BasePipelineJob {
  readonly type: string = "pipeline:generate";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params } = job.data;

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

      await this.updateJobProgress(jobRecordId, "calling provider API", 10);

      const provider = VideoProviderFactory.getProvider(modelInfo.provider);
      const generationResult = await provider.generateVideo(
        modelId,
        providerParams as Record<string, any>,
      );

      await this.updateJobProgress(
        jobRecordId,
        "downloading video from provider",
        60,
      );

      const videoBuffer = await storage.downloadFromUrl(generationResult.url);

      await this.updateJobProgress(jobRecordId, "uploading to S3", 80);

      const s3Key = `executions/${executionId}/${jobId}/output.mp4`;
      const uploadResult = await storage.upload(
        s3Key,
        Buffer.from(videoBuffer),
        {
          contentType: "video/mp4",
        },
      );

      if ("error" in uploadResult) {
        throw uploadResult.error;
      }

      const result = {
        url: uploadResult.url,
        providerUrl: generationResult.url,
        metadata: generationResult.metadata,
      };

      await this.updateJobProgress(jobRecordId, "completed", 100);
      await this.completeJob(jobRecordId, result);

      const orchestrator = await getOrchestrator();
      await orchestrator.checkAndEmitDependentJobs(executionId, jobId);

      console.log(`[GenerateVideoJob] Video generated:`, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[GenerateVideoJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
