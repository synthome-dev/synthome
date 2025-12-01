import { storage } from "@repo/storage";
import { generateId } from "@repo/tools";
import type PgBoss from "pg-boss";
import { BasePipelineJob, PipelineJobData } from "./base-pipeline-job";

interface AddSubtitlesParams {
  videoUrl: string;
  transcript?: any[] | string; // Can be array of words OR URL string
  style?: any; // CaptionStyle
}

export class AddSubtitlesJob extends BasePipelineJob {
  readonly type = "addSubtitles";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params } = job.data;
    const typedParams = params as unknown as AddSubtitlesParams;
    const { videoUrl, style } = typedParams;

    console.log(`[AddSubtitlesJob] Processing job ${jobRecordId}`);

    await this.updateJobProgress(jobRecordId, "processing", 10);

    // Get organizationId for storage
    const execution = await this.getExecutionWithProviderKeys(jobRecordId);
    const organizationId = execution.organizationId;

    try {
      // 1. Get Transcript (either from params or fetch from URL)
      let transcript: any = typedParams.transcript;

      // If transcript is a URL string, fetch it
      if (transcript && typeof transcript === "string") {
        console.log(`[AddSubtitlesJob] Fetching transcript from ${transcript}`);
        await this.updateJobProgress(jobRecordId, "fetching_transcript", 20);

        const response = await fetch(transcript);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch transcript: ${response.status} ${response.statusText}`,
          );
        }
        transcript = await response.json();
        console.log(
          `[AddSubtitlesJob] Fetched transcript with ${transcript.length} words`,
        );
      }

      // If still no transcript, throw error
      if (!transcript || !Array.isArray(transcript)) {
        throw new Error(
          "No transcript provided. Please provide either a transcript array or use a model to generate one.",
        );
      }

      await this.updateJobProgress(jobRecordId, "rendering_subtitles", 50);

      // 2. Generate Subtitle File Content (ASS format) via FFmpeg service
      const ffmpegUrl = process.env.FFMPEG_API_URL;
      console.log(
        `[AddSubtitlesJob] Calling FFmpeg service at ${ffmpegUrl}/generate-subtitles`,
      );

      const generateSubtitlesResponse = await fetch(
        `${ffmpegUrl}/generate-subtitles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            words: transcript,
            preset: style?.preset,
            overrides: style,
            videoWidth: 1080, // Default
            videoHeight: 1920, // Default
          }),
        },
      );

      if (!generateSubtitlesResponse.ok) {
        const errorText = await generateSubtitlesResponse.text();
        throw new Error(
          `Failed to generate subtitles: ${generateSubtitlesResponse.status} ${generateSubtitlesResponse.statusText} - ${errorText}`,
        );
      }

      const { subtitleContent } = (await generateSubtitlesResponse.json()) as {
        subtitleContent: string;
      };

      console.log(
        `[AddSubtitlesJob] Generated ${subtitleContent.length} chars of ASS subtitle content`,
      );
      console.log(
        `[AddSubtitlesJob] First 500 chars:`,
        subtitleContent.substring(0, 500),
      );

      // 3. Burn Subtitles using FFmpeg Service
      await this.updateJobProgress(jobRecordId, "burning_captions", 70);

      console.log(
        `[AddSubtitlesJob] Calling FFmpeg service at ${ffmpegUrl}/burn-subtitles`,
      );

      const requestBody = {
        videoUrl,
        subtitleContent,
        subtitleFormat: "ass",
      };

      console.log(`[AddSubtitlesJob] Request details:`, {
        videoUrl,
        subtitleContentLength: subtitleContent.length,
        subtitleFormat: "ass",
      });

      const response = await fetch(`${ffmpegUrl}/burn-subtitles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FFmpeg service failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const videoBuffer = await response.arrayBuffer();

      // 4. Upload Result
      await this.updateJobProgress(jobRecordId, "uploading", 90);

      const fileName = `captions/${generateId()}.mp4`;
      const uploadResult = await storage.upload(
        fileName,
        Buffer.from(videoBuffer),
        { contentType: "video/mp4", organizationId },
      );

      if ("error" in uploadResult) {
        throw new Error(
          `Failed to upload result: ${uploadResult.error?.message || "Unknown error"}`,
        );
      }

      const outputUrl = uploadResult.url;

      console.log(`[AddSubtitlesJob] Job completed. Result: ${outputUrl}`);

      // 5. Complete Job
      await this.completeJob(jobRecordId, {
        url: outputUrl,
        status: "completed",
        metadata: {
          transcriptLength: transcript.length,
        },
      });
    } catch (error) {
      console.error(`[AddSubtitlesJob] Failed:`, error);
      await this.failJob(
        jobRecordId,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }
}
