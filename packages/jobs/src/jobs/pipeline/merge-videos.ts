import { db, eq, executionJobs } from "@repo/db";
import { storage } from "@repo/storage";
import type PgBoss from "pg-boss";
import { getOrchestrator } from "../../orchestrator/execution-orchestrator.js";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";

export class MergeVideosJob extends BasePipelineJob {
  readonly type: string = "pipeline:merge";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[MergeVideosJob] Merging videos with params:`, params);

      const { inputs, transition } = params as {
        inputs: (string | { url: string })[];
        transition?: { type: "fade"; duration: number };
      };

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        throw new Error("At least 2 inputs required for merging");
      }

      await this.updateJobProgress(jobRecordId, "fetching input videos", 10);

      // Fetch the result URLs from the input jobs or use direct URLs
      const videoUrls: string[] = [];
      for (const input of inputs) {
        // Check if input is a direct URL object
        if (typeof input === "object" && input.url) {
          videoUrls.push(input.url);
        } else if (typeof input === "string") {
          // Input is a job ID - fetch from database
          const inputJob = await db.query.executionJobs.findFirst({
            where: eq(executionJobs.jobId, input),
          });

          if (!inputJob) {
            throw new Error(`Input job ${input} not found`);
          }

          if (inputJob.status !== "completed") {
            throw new Error(`Input job ${input} is not completed`);
          }

          const result = inputJob.result as { url?: string } | null;
          if (!result || !result.url) {
            throw new Error(`Input job ${input} has no video URL in result`);
          }

          videoUrls.push(result.url);
        } else {
          throw new Error(`Invalid input format: ${JSON.stringify(input)}`);
        }
      }

      console.log(`[MergeVideosJob] Merging ${videoUrls.length} videos`);

      await this.updateJobProgress(jobRecordId, "calling FFmpeg API", 30);

      // Call FFmpeg service to merge videos
      const ffmpegApiUrl =
        process.env.FFMPEG_API_URL || "http://localhost:3001";
      const response = await fetch(`${ffmpegApiUrl}/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videos: videoUrls.map((url) => ({ url })),
          transition,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FFmpeg merge failed: ${response.statusText} - ${errorText}`,
        );
      }

      await this.updateJobProgress(jobRecordId, "downloading merged video", 60);

      const mergedVideoBuffer = await response.arrayBuffer();

      await this.updateJobProgress(jobRecordId, "uploading to S3", 80);

      const s3Key = `executions/${executionId}/${jobId}/output.mp4`;
      const uploadResult = await storage.upload(
        s3Key,
        Buffer.from(mergedVideoBuffer),
        {
          contentType: "video/mp4",
        },
      );

      if ("error" in uploadResult) {
        throw uploadResult.error;
      }

      const result = {
        url: uploadResult.url,
        inputCount: videoUrls.length,
      };

      await this.updateJobProgress(jobRecordId, "completed", 100);
      await this.completeJob(jobRecordId, result);

      const orchestrator = await getOrchestrator();
      await orchestrator.checkAndEmitDependentJobs(executionId, jobId);

      console.log(`[MergeVideosJob] Videos merged successfully:`, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[MergeVideosJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
