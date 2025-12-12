import type PgBoss from "pg-boss";
import { BaseJob } from "../core/base-job";
import { deliverJobWebhook } from "@repo/db";

interface JobWebhookDeliveryJobData {
  executionId: string;
  jobId: string;
  operation: string;
  status: "completed" | "failed";
  result: any;
  error: string | null;
  completedAt: string;
  webhook: string;
  webhookSecret?: string | null;
}

/**
 * Async job for delivering per-job webhooks
 * This is emitted when a job has sendJobWebhook: true and completes
 */
export class JobWebhookDeliveryJob extends BaseJob<JobWebhookDeliveryJobData> {
  readonly type: string = "job-webhook-delivery";
  readonly options = {
    retryLimit: 3,
    retryDelay: 5, // 5 seconds
    retryBackoff: true,
    expireInHours: 1,
  };

  async work(job: PgBoss.Job<JobWebhookDeliveryJobData>): Promise<void> {
    const {
      executionId,
      jobId,
      operation,
      status,
      result,
      error,
      completedAt,
      webhook,
      webhookSecret,
    } = job.data;

    console.log(
      `[JobWebhookDeliveryJob] Delivering webhook for job ${jobId} to ${webhook}`,
    );

    try {
      const deliveryResult = await deliverJobWebhook({
        executionId,
        jobId,
        operation,
        status,
        result,
        error,
        completedAt: new Date(completedAt),
        webhook,
        webhookSecret,
      });

      if (!deliveryResult.success) {
        throw new Error(deliveryResult.error || "Job webhook delivery failed");
      }

      console.log(
        `[JobWebhookDeliveryJob] ✅ Webhook delivered successfully for job ${jobId}`,
      );
    } catch (err) {
      console.error(
        `[JobWebhookDeliveryJob] Failed to deliver webhook for job ${jobId}:`,
        err,
      );
      throw err; // Let PgBoss handle retries
    }
  }
}
