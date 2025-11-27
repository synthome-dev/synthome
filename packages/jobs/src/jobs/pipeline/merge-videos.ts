import { storage } from "@repo/storage";
import type PgBoss from "pg-boss";
import { getOrchestrator } from "../../orchestrator/execution-orchestrator.js";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";

interface MergeItem {
  url?: string;
  type: "video" | "image" | "audio";
  duration?: number;
  offset?: number;
  volume?: number;
}

export class MergeVideosJob extends BasePipelineJob {
  readonly type: string = "merge";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[MergeVideosJob] Merging media with params:`, params);
      console.log(`[MergeVideosJob] Dependencies:`, dependencies);

      // Extract items from params
      const { items } = params as { items?: MergeItem[] };

      if (!items || items.length === 0) {
        throw new Error("At least 1 item required for merging");
      }

      await this.updateJobProgress(jobRecordId, "resolving dependencies", 10);

      // Resolve dependency markers in URLs
      const resolvedItems: MergeItem[] = [];
      const audioItems: Array<{
        url: string;
        offset?: number;
        duration?: number;
        volume?: number;
      }> = [];

      for (const item of items) {
        const resolvedItem = { ...item };

        // Resolve dependency markers
        if (item.url) {
          resolvedItem.url = this.resolveDependencyUrl(item.url, dependencies);
        }

        // Separate audio items from visual items
        if (item.type === "audio") {
          if (resolvedItem.url) {
            audioItems.push({
              url: resolvedItem.url,
              offset: item.offset,
              duration: item.duration,
              volume: item.volume,
            });
          }
        } else {
          resolvedItems.push(resolvedItem);
        }
      }

      if (resolvedItems.length === 0) {
        throw new Error(
          "At least 1 visual item (video or image) required for merging",
        );
      }

      console.log(
        `[MergeVideosJob] Resolved ${resolvedItems.length} visual items, ${audioItems.length} audio items`,
      );

      await this.updateJobProgress(jobRecordId, "calling FFmpeg API", 30);

      // Call FFmpeg service with new format
      const ffmpegApiUrl =
        process.env.FFMPEG_API_URL || "http://localhost:3200";
      const response = await fetch(`${ffmpegApiUrl}/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: resolvedItems.map((item) => ({
            url: item.url,
            type: item.type,
            duration: item.duration,
            volume: item.volume,
          })),
          audio: audioItems.length > 0 ? audioItems : undefined,
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
        itemCount: resolvedItems.length,
        audioCount: audioItems.length,
      };

      await this.updateJobProgress(jobRecordId, "completed", 100);
      await this.completeJob(jobRecordId, result);

      const orchestrator = await getOrchestrator();
      await orchestrator.checkAndEmitDependentJobs(executionId, jobId);

      console.log(`[MergeVideosJob] Media merged successfully:`, result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[MergeVideosJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }

  /**
   * Resolve dependency markers to actual URLs
   */
  private resolveDependencyUrl(
    url: string,
    dependencies: Record<string, unknown>,
  ): string {
    // Check for dependency markers
    const videoMatch = url.match(/^_videoJobDependency:(.+)$/);
    const imageMatch = url.match(/^_imageJobDependency:(.+)$/);
    const audioMatch = url.match(/^_audioJobDependency:(.+)$/);

    const match = videoMatch || imageMatch || audioMatch;
    if (!match || !match[1]) {
      // Not a dependency marker, return as-is
      return url;
    }

    const depJobId = match[1];
    const depResult = dependencies[depJobId];

    if (!depResult) {
      throw new Error(`Missing dependency result for job: ${depJobId}`);
    }

    // Extract URL from dependency result
    return this.extractUrlFromResult(depResult, depJobId);
  }

  /**
   * Extract URL from various result formats
   */
  private extractUrlFromResult(result: unknown, jobId: string): string {
    if (!result || typeof result !== "object") {
      throw new Error(
        `Invalid dependency result for job ${jobId}: ${JSON.stringify(result)}`,
      );
    }

    // Check for outputs array format (from generate jobs)
    if ("outputs" in result) {
      const outputs = (result as { outputs: Array<{ url?: string }> }).outputs;
      if (Array.isArray(outputs) && outputs.length > 0 && outputs[0]?.url) {
        return outputs[0].url;
      }
    }

    // Check for direct URL format
    if ("url" in result) {
      return (result as { url: string }).url;
    }

    throw new Error(
      `Could not extract URL from dependency result for job ${jobId}: ${JSON.stringify(result)}`,
    );
  }
}
