import { db, eq, executionJobs } from "@repo/db";
import { storage } from "@repo/storage";
import type PgBoss from "pg-boss";
import { getOrchestrator } from "../../orchestrator/execution-orchestrator.js";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";

export class MergeVideosJob extends BasePipelineJob {
  readonly type: string = "merge";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[MergeVideosJob] Merging videos with params:`, params);
      console.log(`[MergeVideosJob] Dependencies:`, dependencies);

      // Extract transition params
      const { transition, transitionDuration } = params as {
        transition?: string;
        transitionDuration?: number;
      };

      // Get video URLs from dependencies
      const dependencyResults = Object.values(dependencies);

      if (!dependencyResults || dependencyResults.length < 2) {
        throw new Error("At least 2 inputs required for merging");
      }

      await this.updateJobProgress(jobRecordId, "extracting video URLs", 10);

      // Extract video URLs from dependency results
      const videoUrls: string[] = [];
      for (const depResult of dependencyResults) {
        // Check if the result has outputs array (from generate job)
        if (
          depResult &&
          typeof depResult === "object" &&
          "outputs" in depResult
        ) {
          const outputs = (depResult as any).outputs;
          if (Array.isArray(outputs) && outputs.length > 0 && outputs[0].url) {
            videoUrls.push(outputs[0].url);
          } else {
            throw new Error(
              `Dependency result has invalid outputs: ${JSON.stringify(depResult)}`,
            );
          }
        }
        // Check if it's a direct URL format
        else if (
          depResult &&
          typeof depResult === "object" &&
          "url" in depResult
        ) {
          videoUrls.push((depResult as any).url);
        } else {
          throw new Error(
            `Invalid dependency result format: ${JSON.stringify(depResult)}`,
          );
        }
      }

      if (videoUrls.length < 2) {
        throw new Error(
          `At least 2 video URLs required for merging, got ${videoUrls.length}`,
        );
      }

      console.log(
        `[MergeVideosJob] Merging ${videoUrls.length} videos:`,
        videoUrls,
      );

      await this.updateJobProgress(jobRecordId, "calling FFmpeg API", 30);

      // Call FFmpeg service to merge videos
      const ffmpegApiUrl =
        process.env.FFMPEG_API_URL || "http://localhost:3200";
      const response = await fetch(`${ffmpegApiUrl}/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videos: videoUrls.map((url) => ({ url })),
          transition: transition
            ? {
                type: transition,
                duration: transitionDuration || 1,
              }
            : undefined,
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
