import { db, executionJobs, and, eq, sql } from "@repo/db";
import {
  parseModelPolling,
  getModelCapabilities,
  getModelInfo,
} from "@repo/model-schemas";
import { VideoProviderFactory } from "@repo/providers";
import { completeAsyncJob, failAsyncJob } from "@repo/jobs";

interface PollingWorkerOptions {
  intervalMs?: number; // How often to check for jobs to poll
  maxPollAttempts?: number; // Maximum number of polling attempts before giving up
  backoffMultiplier?: number; // Multiplier for exponential backoff
  initialBackoffMs?: number; // Initial backoff duration in ms
}

export class PollingWorker {
  private intervalMs: number;
  private maxPollAttempts: number;
  private backoffMultiplier: number;
  private initialBackoffMs: number;
  private intervalHandle: Timer | null = null;
  private isRunning = false;

  constructor(options: PollingWorkerOptions = {}) {
    this.intervalMs = options.intervalMs || 10000; // Default: check every 10 seconds
    this.maxPollAttempts = options.maxPollAttempts || 100; // Default: max 100 attempts
    this.backoffMultiplier = options.backoffMultiplier || 1.5; // Exponential backoff
    this.initialBackoffMs = options.initialBackoffMs || 5000; // Start with 5 second intervals
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[PollingWorker] Already running");
      return;
    }

    this.isRunning = true;
    console.log(
      `[PollingWorker] Starting (check interval: ${this.intervalMs}ms)`,
    );

    // Run immediately on start (with error handling to not crash the worker)
    this.pollPendingJobs().catch((error) => {
      console.error("[PollingWorker] Error in initial polling cycle:", error);
    });

    // Then run on interval
    this.intervalHandle = setInterval(() => {
      this.pollPendingJobs().catch((error) => {
        console.error("[PollingWorker] Error in polling cycle:", error);
      });
    }, this.intervalMs);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log("[PollingWorker] Stopping");
    this.isRunning = false;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async pollPendingJobs(): Promise<void> {
    try {
      // Find jobs that are:
      // 1. Using polling strategy
      // 2. Still processing
      // 3. Ready to be polled (nextPollAt is now or in the past)
      // 4. Haven't exceeded max poll attempts
      const jobsToPoll = await db
        .select()
        .from(executionJobs)
        .where(
          and(
            eq(executionJobs.waitingStrategy, "polling"),
            eq(executionJobs.status, "processing"),
            sql`${executionJobs.nextPollAt} <= ${new Date()}`,
          ),
        );

      if (jobsToPoll.length === 0) {
        return;
      }

      console.log(`[PollingWorker] Found ${jobsToPoll.length} jobs to poll`);

      // Poll each job
      for (const job of jobsToPoll) {
        await this.pollJob(job).catch((error) => {
          console.error(`[PollingWorker] Error polling job ${job.id}:`, error);
        });
      }
    } catch (error) {
      console.error("[PollingWorker] Error fetching jobs to poll:", error);
    }
  }

  private async pollJob(job: any): Promise<void> {
    const jobRecordId = job.id;
    const providerJobId = job.providerJobId;
    const pollAttempts = job.pollAttempts || 0;

    console.log(
      `[PollingWorker] Polling job ${jobRecordId} (attempt ${pollAttempts + 1})`,
    );

    // Check if max attempts exceeded
    if (pollAttempts >= this.maxPollAttempts) {
      console.error(
        `[PollingWorker] Job ${jobRecordId} exceeded max poll attempts`,
      );

      await db
        .update(executionJobs)
        .set({
          status: "failed",
          error: `Exceeded maximum polling attempts (${this.maxPollAttempts})`,
          completedAt: new Date(),
        })
        .where(eq(executionJobs.id, jobRecordId));

      return;
    }

    if (!providerJobId) {
      console.error(`[PollingWorker] Job ${jobRecordId} has no providerJobId`);
      return;
    }

    try {
      // Get modelId from job metadata
      const metadata = job.metadata as Record<string, unknown>;
      const modelId = metadata?.modelId as string | undefined;

      if (!modelId) {
        throw new Error("No modelId in job metadata");
      }

      // Check if model supports polling
      const capabilities = getModelCapabilities(modelId);
      if (!capabilities.supportsPolling) {
        throw new Error(`Model ${modelId} does not support polling`);
      }

      // Get provider from model info
      const modelInfo = getModelInfo(modelId);
      if (!modelInfo) {
        throw new Error(`Model ${modelId} not found in registry`);
      }

      const provider = VideoProviderFactory.getProvider(modelInfo.provider);

      // Poll for job status
      const statusResponse = await provider.getJobStatus(providerJobId);

      // Parse response using model-specific parser
      const parseResult = parseModelPolling(modelId, statusResponse);

      console.log(
        `[PollingWorker] Job ${jobRecordId} status: ${parseResult.status}`,
      );

      // Handle based on status
      if (parseResult.status === "completed") {
        if (!parseResult.outputs || parseResult.outputs.length === 0) {
          throw new Error("Job completed but no outputs received");
        }

        await completeAsyncJob(jobRecordId, parseResult.outputs);
      } else if (parseResult.status === "failed") {
        await failAsyncJob(
          jobRecordId,
          parseResult.error || "Provider job failed",
        );
      } else if (parseResult.status === "processing") {
        // Update poll attempts and schedule next poll with exponential backoff
        const nextBackoffMs =
          this.initialBackoffMs *
          Math.pow(this.backoffMultiplier, pollAttempts);
        const nextPollAt = new Date(Date.now() + nextBackoffMs);

        console.log(
          `[PollingWorker] Job ${jobRecordId} still processing, next poll at ${nextPollAt.toISOString()}`,
        );

        await db
          .update(executionJobs)
          .set({
            pollAttempts: pollAttempts + 1,
            nextPollAt,
            providerJobStatus: parseResult.metadata?.providerStatus as
              | string
              | undefined,
          })
          .where(eq(executionJobs.id, jobRecordId));
      }
    } catch (error) {
      console.error(`[PollingWorker] Error polling job ${jobRecordId}:`, error);

      // Increment poll attempts and schedule retry
      const nextBackoffMs =
        this.initialBackoffMs * Math.pow(this.backoffMultiplier, pollAttempts);
      const nextPollAt = new Date(Date.now() + nextBackoffMs);

      await db
        .update(executionJobs)
        .set({
          pollAttempts: pollAttempts + 1,
          nextPollAt,
          error: error instanceof Error ? error.message : "Polling error",
        })
        .where(eq(executionJobs.id, jobRecordId));
    }
  }
}
