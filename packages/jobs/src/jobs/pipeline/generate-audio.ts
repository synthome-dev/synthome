import {
  getModelInfo,
  parseModelOptions,
  parseModelPolling,
} from "@repo/model-schemas";
import { VideoProviderFactory } from "@repo/providers";
import type PgBoss from "pg-boss";
import { isBase64String, uploadBase64Audio } from "../../utils/upload-audio.js";
import { BasePipelineJob, type PipelineJobData } from "./base-pipeline-job.js";

export class GenerateAudioJob extends BasePipelineJob {
  readonly type: string = "generateAudio";

  async work(job: PgBoss.Job<PipelineJobData>): Promise<void> {
    const { jobRecordId, params } = job.data;

    try {
      await this.updateJobProgress(jobRecordId, "starting", 0);

      console.log(`[GenerateAudioJob] Generating audio with params:`, params);

      // Fetch execution to get provider API keys
      const execution = await this.getExecutionWithProviderKeys(jobRecordId);

      console.log(
        `[GenerateAudioJob] Execution provider keys:`,
        JSON.stringify(execution.providerApiKeys, null, 2),
      );

      const {
        modelId,
        apiKey: modelApiKey,
        ...providerParams
      } = params as {
        modelId?: string;
        apiKey?: string;
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
          `[GenerateAudioJob] Validated params for ${modelId}:`,
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
        `[GenerateAudioJob] Using synchronous polling for model ${modelId}`,
      );

      await this.updateJobProgress(jobRecordId, "calling provider API", 10);

      // Get API key: prioritize model-level apiKey, fallback to execution-level provider key
      const providerApiKey =
        modelApiKey ||
        execution.providerApiKeys?.[
          modelInfo.provider as keyof typeof execution.providerApiKeys
        ];

      console.log(`[GenerateAudioJob] Provider: ${modelInfo.provider}`);
      console.log(
        `[GenerateAudioJob] Model-level API key present: ${!!modelApiKey}`,
      );
      console.log(
        `[GenerateAudioJob] Execution-level API key for ${modelInfo.provider}: ${!!execution.providerApiKeys?.[modelInfo.provider as keyof typeof execution.providerApiKeys]}`,
      );
      console.log(
        `[GenerateAudioJob] Final providerApiKey present: ${!!providerApiKey}`,
      );
      console.log(
        `[GenerateAudioJob] Using ${modelApiKey ? "model-level" : "execution-level"} API key for provider ${modelInfo.provider}`,
      );

      const provider = VideoProviderFactory.getProvider(
        modelInfo.provider,
        providerApiKey,
      );

      console.log(
        `[GenerateAudioJob] Calling provider.startGeneration with modelId: ${modelId}, params:`,
        validatedParams,
      );

      // Start audio generation (no webhook needed - we'll poll synchronously)
      const generationStart = await provider.startGeneration(
        modelId,
        validatedParams,
      );

      console.log(
        `[GenerateAudioJob] Provider returned:`,
        JSON.stringify(generationStart, null, 2),
      );

      console.log(
        `[GenerateAudioJob] Started provider job: ${generationStart.providerJobId}`,
      );

      await this.updateJobProgress(jobRecordId, "polling for completion", 30);

      // Poll synchronously until complete (audio is very fast: 250-300ms typical)
      const POLL_INTERVAL = 1000; // 1 second
      const MAX_ATTEMPTS = 30; // 30 seconds timeout
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
          throw new Error(status.error || "Audio generation failed");
        }

        if (status.status === "completed") {
          // For audio, we need the raw response to parse with parseReplicateAudio
          if (!provider.getRawJobResponse) {
            throw new Error("Provider does not support raw response retrieval");
          }

          const rawResponse = await provider.getRawJobResponse(
            generationStart.providerJobId,
          );

          // Parse the raw response using the model's polling parser
          const parsedResult = parseModelPolling(modelId, rawResponse);

          console.log(`[GenerateAudioJob] Audio generated successfully`);

          // Check if result contains base64 audio string and upload to CDN
          // New format: { status, outputs: [{ type, url, mimeType }] }
          if (
            parsedResult &&
            typeof parsedResult === "object" &&
            "outputs" in parsedResult &&
            Array.isArray(parsedResult.outputs) &&
            parsedResult.outputs.length > 0
          ) {
            const firstOutput = parsedResult.outputs[0];
            if (
              firstOutput &&
              typeof firstOutput === "object" &&
              "url" in firstOutput &&
              typeof firstOutput.url === "string" &&
              isBase64String(firstOutput.url)
            ) {
              console.log(
                `[GenerateAudioJob] Detected base64 audio string, uploading to CDN...`,
              );

              await this.updateJobProgress(
                jobRecordId,
                "uploading audio to CDN",
                92,
              );

              const cdnUrl = await uploadBase64Audio(firstOutput.url, {
                executionId: execution.executionId,
                jobId: jobRecordId,
                organizationId: execution.organizationId,
              });

              console.log(
                `[GenerateAudioJob] Successfully uploaded audio to CDN: ${cdnUrl}`,
              );

              // Replace base64 string with CDN URL in the outputs array
              if (parsedResult.outputs && parsedResult.outputs[0]) {
                parsedResult.outputs[0].url = cdnUrl;
              }
            }
          }

          await this.updateJobProgress(jobRecordId, "completed", 100);
          await this.completeJob(jobRecordId, parsedResult);
          return;
        }

        // Still processing, continue polling
      }

      throw new Error(
        `Audio generation timeout after ${MAX_ATTEMPTS} attempts`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`[GenerateAudioJob] Failed:`, errorMessage);
      console.error(`[GenerateAudioJob] Error stack:`, errorStack);
      console.error(`[GenerateAudioJob] Full error object:`, error);
      await this.failJob(jobRecordId, errorMessage);
      throw error;
    }
  }
}
