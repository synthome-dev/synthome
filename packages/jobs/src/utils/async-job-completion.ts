import { db, eq, executionJobs, executions } from "@repo/db";
import type { MediaOutput } from "@repo/model-schemas";
import { storage } from "@repo/storage";
import { generateId } from "@repo/tools";
import { getOrchestrator } from "../orchestrator/execution-orchestrator";
import { JobClient } from "../client/job-client";

/**
 * Complete an async job after receiving webhook or polling result
 * This function:
 * 1. Downloads the media from the provider URL
 * 2. Uploads it to CDN
 * 3. Updates the job record with the CDN URL
 * 4. Triggers dependent jobs
 */
export async function completeAsyncJob(
  jobRecordId: string,
  outputs: MediaOutput[],
): Promise<void> {
  console.log(
    `[AsyncJobCompletion] Completing job ${jobRecordId} with ${outputs.length} outputs`,
  );

  try {
    // 1. Get job record from database
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.id, jobRecordId))
      .limit(1);

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    if (job.status === "completed") {
      console.log(`[AsyncJobCompletion] Job ${jobRecordId} already completed`);
      return;
    }

    // Get execution to retrieve organizationId for storage
    const [execution] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, job.executionId))
      .limit(1);

    const organizationId = execution?.organizationId ?? undefined;

    // 2. Download media from provider URLs and upload to CDN
    const cdnUrls: string[] = [];

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      if (!output) {
        console.error(`[AsyncJobCompletion] Output ${i} is undefined`);
        continue;
      }

      console.log(
        `[AsyncJobCompletion] Processing output ${i + 1}/${outputs.length}: ${output.url}`,
      );

      try {
        // Determine file extension based on media type
        const ext = getFileExtension(output.type, output.mimeType);
        const filename = `${generateId()}.${ext}`;
        const storagePath = `executions/${job.executionId}/${filename}`;

        if (!output.url) {
          throw new Error(`Output ${i} has no URL`);
        }

        // Download from provider and upload to CDN
        const uploadResult = await storage.upload(storagePath, output.url, {
          contentType: output.mimeType,
          organizationId,
        });

        if ("error" in uploadResult) {
          throw uploadResult.error;
        }

        console.log(
          `[AsyncJobCompletion] Uploaded to CDN: ${uploadResult.url}`,
        );
        cdnUrls.push(uploadResult.url);
      } catch (error) {
        console.error(
          `[AsyncJobCompletion] Error processing output ${i}:`,
          error,
        );
        throw new Error(
          `Failed to download/upload output ${i}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    // 3. Prepare result with CDN URLs
    const result = {
      outputs: outputs.map((output, i) => ({
        ...output,
        url: cdnUrls[i], // Replace provider URL with CDN URL
      })),
      completedAt: new Date().toISOString(),
    };

    // 4. Update job record in database
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));

    console.log(`[AsyncJobCompletion] Job ${jobRecordId} marked as completed`);

    // 5. Trigger dependent jobs via orchestrator
    const orchestrator = await getOrchestrator();
    await orchestrator.checkAndEmitDependentJobs(job.executionId, job.jobId);

    // 6. Emit async job webhook delivery if sendJobWebhook is true (uses execution's webhook URL)
    const params = (job.metadata as any)?.params;
    if (params?.sendJobWebhook === true && execution?.webhook) {
      try {
        const jobClient = new JobClient();
        await jobClient.start();
        await jobClient.emit("job-webhook-delivery", {
          executionId: job.executionId,
          jobId: job.jobId,
          operation: job.operation,
          status: "completed",
          result,
          error: null,
          completedAt: new Date().toISOString(),
          webhook: execution.webhook,
          webhookSecret: execution.webhookSecret,
        });
        await jobClient.stop();
        console.log(
          `[AsyncJobCompletion] Emitted job webhook delivery for ${job.jobId}`,
        );
      } catch (webhookError) {
        // Don't fail the job if webhook emission fails
        console.error(
          `[AsyncJobCompletion] Failed to emit job webhook for ${job.jobId}:`,
          webhookError,
        );
      }
    }

    console.log(
      `[AsyncJobCompletion] Successfully completed job ${jobRecordId}`,
    );
  } catch (error) {
    console.error(
      `[AsyncJobCompletion] Error completing job ${jobRecordId}:`,
      error,
    );

    // Mark job as failed if completion logic fails
    await failAsyncJob(
      jobRecordId,
      `Completion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    throw error;
  }
}

/**
 * Mark an async job as failed
 */
export async function failAsyncJob(
  jobRecordId: string,
  error: string,
): Promise<void> {
  console.error(`[AsyncJobCompletion] Failing job ${jobRecordId}: ${error}`);

  try {
    // 1. Get job record
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.id, jobRecordId))
      .limit(1);

    if (!job) {
      console.error(
        `[AsyncJobCompletion] Job ${jobRecordId} not found for failure update`,
      );
      return;
    }

    // 2. Update job record as failed
    await db
      .update(executionJobs)
      .set({
        status: "failed",
        error,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));

    console.log(`[AsyncJobCompletion] Job ${jobRecordId} marked as failed`);

    // 3. Still check for dependent jobs (they may need to be failed too)
    const orchestrator = await getOrchestrator();
    await orchestrator.checkAndEmitDependentJobs(job.executionId, job.jobId);
  } catch (failError) {
    console.error(
      `[AsyncJobCompletion] Error marking job as failed:`,
      failError,
    );
  }
}

/**
 * Helper to determine file extension from media type and mime type
 */
function getFileExtension(mediaType: string, mimeType?: string): string {
  // Use mime type if available
  if (mimeType) {
    const mimeMap: Record<string, string> = {
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/quicktime": "mov",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
    };

    if (mimeMap[mimeType]) {
      return mimeMap[mimeType];
    }
  }

  // Fallback to media type
  const typeMap: Record<string, string> = {
    video: "mp4",
    audio: "mp3",
    image: "png",
  };

  return typeMap[mediaType] || "bin";
}
