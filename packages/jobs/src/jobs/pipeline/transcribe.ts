import { VideoProviderFactory } from "@repo/providers";
import { storage } from "@repo/storage";
import { generateId } from "@repo/tools";
import type PgBoss from "pg-boss";
import { BasePipelineJob, PipelineJobData } from "./base-pipeline-job";
import {
  getModelInfo,
  parseModelOptions,
  parseModelPolling,
} from "@repo/model-schemas";

export class TranscribeJob extends BasePipelineJob {
  readonly type = "transcribe";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[TranscribeJob] Processing job ${jobRecordId}`);
      console.log(`[TranscribeJob] Params:`, params);

      // Extract params
      const {
        modelId,
        apiKey: modelApiKey,
        videoUrl,
        ...otherParams
      } = params as {
        modelId?: string;
        apiKey?: string;
        videoUrl?: string;
        [key: string]: any;
      };

      if (!modelId) {
        throw new Error("modelId is required in params");
      }

      if (!videoUrl) {
        throw new Error("videoUrl is required in params");
      }

      // Get model info
      const modelInfo = getModelInfo(modelId);
      if (!modelInfo) {
        throw new Error(`Unknown model: ${modelId}`);
      }

      console.log(
        `[TranscribeJob] Model: ${modelId}, Provider: ${modelInfo.provider}`,
      );

      // Step 1: Extract audio from video using FFmpeg service
      console.log(`[TranscribeJob] Extracting audio from video: ${videoUrl}`);
      await this.updateJobProgress(jobRecordId, "extracting_audio", 20);

      const audioUrl = await this.extractAudioFromVideo(videoUrl);
      console.log(`[TranscribeJob] Audio extracted: ${audioUrl}`);

      // Get provider API keys from execution
      const execution = await this.getExecutionWithProviderKeys(jobRecordId);
      const providerKey =
        modelApiKey ||
        execution.providerApiKeys?.[
          modelInfo.provider as keyof typeof execution.providerApiKeys
        ];

      if (!providerKey) {
        throw new Error(
          `No API key found for provider: ${modelInfo.provider}. Please provide API key.`,
        );
      }

      await this.updateJobProgress(jobRecordId, "validating_params", 30);

      // Prepare params with audio URL
      // Different models have different parameter formats
      let transcribeParams: Record<string, any>;

      if (
        modelId ===
        "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c"
      ) {
        // incredibly-fast-whisper parameters
        transcribeParams = {
          audio: audioUrl,
          task: "transcribe",
          language: "None", // Auto-detect
          timestamp: "word", // Word-level timestamps
          ...otherParams,
        };
      } else {
        // openai/whisper parameters
        transcribeParams = {
          audio: audioUrl,
          transcription: "srt", // Get SRT format
          word_timestamps: true, // Enable word-level timestamps (though not supported)
          ...otherParams,
        };
      }

      // Validate and parse parameters against model schema
      let validatedParams: Record<string, unknown>;
      try {
        validatedParams = parseModelOptions(modelId, transcribeParams);
        console.log(
          `[TranscribeJob] Validated params for ${modelId}:`,
          validatedParams,
        );
      } catch (error) {
        const validationError =
          error instanceof Error ? error.message : "Unknown validation error";
        throw new Error(
          `Parameter validation failed for model ${modelId}: ${validationError}`,
        );
      }

      await this.updateJobProgress(jobRecordId, "transcribing", 40);

      // Get provider instance
      const providerInstance = VideoProviderFactory.getProvider(
        modelInfo.provider,
        providerKey,
      );

      console.log(
        `[TranscribeJob] Calling provider ${modelInfo.provider} with validated params`,
        transcribeParams,
      );

      // Start transcription
      const generationStart = await providerInstance.startGeneration(
        modelId,
        validatedParams,
      );

      console.log(
        `[TranscribeJob] Started transcription job: ${generationStart.providerJobId}`,
      );

      await this.updateJobProgress(jobRecordId, "polling_for_completion", 50);

      // Poll for completion
      const POLL_INTERVAL = 2000; // 2 seconds
      const MAX_ATTEMPTS = 60; // 2 minutes timeout
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        attempts++;

        const progressPercentage = Math.min(
          50 + Math.floor((attempts / MAX_ATTEMPTS) * 30),
          80,
        );
        await this.updateJobProgress(
          jobRecordId,
          `polling (attempt ${attempts}/${MAX_ATTEMPTS})`,
          progressPercentage,
        );

        // Check status
        const status = await providerInstance.getJobStatus(
          generationStart.providerJobId,
        );

        if (status.status === "failed") {
          throw new Error(status.error || "Transcription failed");
        }

        if (status.status === "completed") {
          // Get raw response
          if (!providerInstance.getRawJobResponse) {
            throw new Error("Provider does not support raw response retrieval");
          }

          const rawResponse = await providerInstance.getRawJobResponse(
            generationStart.providerJobId,
          );

          // Parse using model's polling parser
          const parsedResult = parseModelPolling(modelId, rawResponse);

          console.log(
            `[TranscribeJob] Transcription completed:`,
            JSON.stringify(parsedResult).substring(0, 200),
          );

          await this.updateJobProgress(
            jobRecordId,
            "processing_transcript",
            85,
          );

          // Normalize transcript from parsed result
          // The parser wraps the response in { status, outputs: [{ type, data }] }
          let transcript: any[];

          // Extract the actual transcript data from the wrapper
          let transcriptData: any;
          if (
            parsedResult &&
            typeof parsedResult === "object" &&
            "outputs" in parsedResult
          ) {
            const outputs = (parsedResult as any).outputs;
            if (
              Array.isArray(outputs) &&
              outputs.length > 0 &&
              outputs[0].data
            ) {
              transcriptData = outputs[0].data;
            }
          } else {
            transcriptData = parsedResult;
          }

          console.log(
            `[TranscribeJob] Extracted transcript data:`,
            JSON.stringify(transcriptData).substring(0, 300),
          );

          // Handle different response formats from different Whisper models
          if (transcriptData.chunks && Array.isArray(transcriptData.chunks)) {
            // incredibly-fast-whisper format: { chunks: [{ text, timestamp: [start, end] }], text }
            transcript = transcriptData.chunks.map((chunk: any) => ({
              word: chunk.text.trim(),
              start: chunk.timestamp[0],
              end: chunk.timestamp[1],
            }));
          } else if (transcriptData.segments) {
            // openai/whisper format with segments (may have words array)
            transcript = transcriptData.segments.flatMap((s: any) =>
              s.words
                ? s.words.map((w: any) => ({
                    word: w.word,
                    start: w.start,
                    end: w.end,
                  }))
                : [],
            );
          } else if (transcriptData.words) {
            // Direct words array
            transcript = transcriptData.words;
          } else {
            console.error(
              "[TranscribeJob] Unexpected transcript format:",
              JSON.stringify(transcriptData).substring(0, 200),
            );
            throw new Error(
              "Transcription output format not recognized (missing chunks, segments, or words)",
            );
          }

          if (!transcript || transcript.length === 0) {
            throw new Error("Transcription completed but returned no words");
          }

          console.log(
            `[TranscribeJob] Transcription completed with ${transcript.length} words`,
          );

          await this.updateJobProgress(jobRecordId, "uploading", 90);

          // Upload transcript JSON to storage
          const fileName = `transcripts/${generateId()}.json`;
          const transcriptBuffer = Buffer.from(JSON.stringify(transcript));

          const { url: transcriptUrl, error: uploadError } =
            await storage.upload(fileName, transcriptBuffer, {
              contentType: "application/json",
            });

          if (uploadError || !transcriptUrl) {
            throw new Error(
              `Failed to upload transcript: ${uploadError?.message || "Unknown error"}`,
            );
          }

          console.log(`[TranscribeJob] Transcript uploaded: ${transcriptUrl}`);

          await this.updateJobProgress(jobRecordId, "completed", 100);

          // Complete job with transcript URL
          await this.completeJob(jobRecordId, {
            url: transcriptUrl,
            status: "completed",
            metadata: { wordCount: transcript.length },
          });
          return;
        }

        // Still processing, continue polling
      }

      throw new Error(`Transcription timeout after ${MAX_ATTEMPTS} attempts`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`[TranscribeJob] Failed:`, errorMessage);
      console.error(`[TranscribeJob] Error stack:`, errorStack);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }

  /**
   * Extract audio from video and upload to storage
   */
  private async extractAudioFromVideo(videoUrl: string): Promise<string> {
    const ffmpegServiceUrl = process.env.FFMPEG_API_URL;

    try {
      // Download the video
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(
          `Failed to download video: ${videoResponse.statusText}`,
        );
      }

      const videoBuffer = await videoResponse.arrayBuffer();

      // Extract audio using FFmpeg service
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([videoBuffer], { type: "video/mp4" }),
        "video.mp4",
      );
      formData.append("outputFormat", "mp3");
      formData.append("audioCodec", "libmp3lame");
      formData.append("audioBitrate", "192k");

      const ffmpegResponse = await fetch(`${ffmpegServiceUrl}/convert`, {
        method: "POST",
        body: formData,
      });

      if (!ffmpegResponse.ok) {
        throw new Error(`FFmpeg service failed: ${ffmpegResponse.statusText}`);
      }

      const audioBuffer = Buffer.from(await ffmpegResponse.arrayBuffer());

      // Upload audio to storage
      const audioFileName = `audio/${generateId()}.mp3`;
      const { url: audioUrl, error: uploadError } = await storage.upload(
        audioFileName,
        audioBuffer,
        { contentType: "audio/mpeg" },
      );

      if (uploadError || !audioUrl) {
        throw new Error(
          `Failed to upload audio: ${uploadError?.message || "Unknown error"}`,
        );
      }

      return audioUrl;
    } catch (error) {
      console.error("[TranscribeJob] Audio extraction failed:", error);
      throw new Error(
        `Failed to extract audio: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
