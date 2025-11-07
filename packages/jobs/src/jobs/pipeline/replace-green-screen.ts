import type PgBoss from "pg-boss";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";
import { storage } from "@repo/storage";

export class ReplaceGreenScreenJob extends BasePipelineJob {
  readonly type: string = "replaceGreenScreen";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, executionId, jobId, params, dependencies } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[ReplaceGreenScreenJob] Processing with params:`, params);

      const { video, background, chromaKeyColor, similarity, blend } =
        params as {
          video?: string;
          background?: string | string[];
          chromaKeyColor?: string;
          similarity?: number;
          blend?: number;
        };

      // Resolve video URL from dependencies or direct URL
      let videoUrl = video;
      if (!videoUrl) {
        throw new Error("video is required in params");
      }

      // Check if video is a dependency reference
      if (videoUrl.startsWith("from-")) {
        const depJobId = videoUrl.replace("from-", "");
        console.log(
          `[ReplaceGreenScreenJob] Resolving video from dependency: ${depJobId}`,
        );

        if (!dependencies || !dependencies[depJobId]) {
          throw new Error(`Dependency ${depJobId} not found for video`);
        }

        const depResult = dependencies[depJobId];
        if (typeof depResult === "object" && "outputs" in depResult) {
          const outputs = (depResult as any).outputs;
          if (Array.isArray(outputs) && outputs.length > 0 && outputs[0].url) {
            videoUrl = outputs[0].url;
          }
        } else if (typeof depResult === "object" && "url" in depResult) {
          videoUrl = (depResult as any).url;
        } else {
          throw new Error(
            `Could not extract video URL from dependency ${depJobId}`,
          );
        }
      }

      console.log(`[ReplaceGreenScreenJob] Using video URL: ${videoUrl}`);

      // Resolve background URLs
      let backgroundUrls: string[] = [];

      if (!background) {
        throw new Error("background is required in params");
      }

      const backgrounds = Array.isArray(background) ? background : [background];

      for (const bg of backgrounds) {
        let bgUrl = bg;

        // Check if background is a dependency reference
        if (typeof bg === "string" && bg.startsWith("from-")) {
          const depJobId = bg.replace("from-", "");
          console.log(
            `[ReplaceGreenScreenJob] Resolving background from dependency: ${depJobId}`,
          );

          if (!dependencies || !dependencies[depJobId]) {
            throw new Error(`Dependency ${depJobId} not found for background`);
          }

          const depResult = dependencies[depJobId];
          if (typeof depResult === "object" && "outputs" in depResult) {
            const outputs = (depResult as any).outputs;
            if (
              Array.isArray(outputs) &&
              outputs.length > 0 &&
              outputs[0].url
            ) {
              bgUrl = outputs[0].url;
            }
          } else if (typeof depResult === "object" && "url" in depResult) {
            bgUrl = (depResult as any).url;
          } else {
            throw new Error(
              `Could not extract background URL from dependency ${depJobId}`,
            );
          }
        }

        backgroundUrls.push(bgUrl);
      }

      console.log(
        `[ReplaceGreenScreenJob] Using ${backgroundUrls.length} background(s):`,
        backgroundUrls,
      );

      await this.updateJobProgress(jobRecordId, "processing video", 20);

      // Call FFmpeg service
      const ffmpegApiUrl =
        process.env.FFMPEG_API_URL || "http://localhost:3200";

      console.log(
        `[ReplaceGreenScreenJob] Calling FFmpeg service at: ${ffmpegApiUrl}`,
      );

      const response = await fetch(`${ffmpegApiUrl}/replace-green-screen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          backgroundUrls,
          chromaKeyColor,
          similarity,
          blend,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FFmpeg service returned error: ${response.status} - ${errorText}`,
        );
      }

      await this.updateJobProgress(jobRecordId, "uploading result", 80);

      // Get the video buffer from response
      const videoBuffer = Buffer.from(await response.arrayBuffer());

      console.log(
        `[ReplaceGreenScreenJob] Received processed video (${videoBuffer.length} bytes)`,
      );

      // Upload to storage
      const s3Key = `executions/${executionId}/${jobId}/output.mp4`;
      const uploadResult = await storage.upload(s3Key, videoBuffer, {
        contentType: "video/mp4",
      });

      if ("error" in uploadResult) {
        throw uploadResult.error;
      }

      console.log(
        `[ReplaceGreenScreenJob] Uploaded to storage: ${uploadResult.url}`,
      );

      const result = {
        url: uploadResult.url,
        backgroundCount: backgroundUrls.length,
        size: videoBuffer.length,
      };

      await this.updateJobProgress(jobRecordId, "completed", 100);

      // Complete the job with result
      await this.completeJob(jobRecordId, result);

      console.log(
        `[ReplaceGreenScreenJob] Job completed successfully:`,
        result,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[ReplaceGreenScreenJob] Failed:`, errorMessage);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
