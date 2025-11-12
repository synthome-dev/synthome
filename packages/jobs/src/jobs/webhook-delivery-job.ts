import type PgBoss from "pg-boss";
import { BaseJob } from "../core/base-job";
import { deliverWebhook } from "@repo/db";
import { db, executions, eq } from "@repo/db";

interface WebhookDeliveryJobData {
  executionId: string;
}

export class WebhookDeliveryJob extends BaseJob<WebhookDeliveryJobData> {
  readonly type: string = "webhook-delivery";
  readonly options = {
    retryLimit: 5,
    retryDelay: 10, // 10 seconds
    retryBackoff: true,
    expireInHours: 1,
  };

  async work(job: PgBoss.Job<WebhookDeliveryJobData>): Promise<void> {
    const { executionId } = job.data;

    console.log(
      `[WebhookDeliveryJob] Delivering webhook for execution: ${executionId}`,
    );

    try {
      // Fetch the execution
      const [execution] = await db
        .select()
        .from(executions)
        .where(eq(executions.id, executionId));

      if (!execution) {
        console.error(
          `[WebhookDeliveryJob] Execution not found: ${executionId}`,
        );
        throw new Error(`Execution not found: ${executionId}`);
      }

      // Check if webhook already delivered
      if (execution.webhookDeliveredAt) {
        console.log(
          `[WebhookDeliveryJob] Webhook already delivered for ${executionId}`,
        );
        return;
      }

      // Check if execution has a webhook URL
      if (!execution.webhook) {
        console.log(
          `[WebhookDeliveryJob] No webhook URL for execution ${executionId}`,
        );
        return;
      }

      // Deliver the webhook
      const result = await deliverWebhook(execution);

      if (!result.success) {
        throw new Error(result.error || "Webhook delivery failed");
      }

      console.log(
        `[WebhookDeliveryJob] ✅ Webhook delivered successfully for ${executionId}`,
      );
    } catch (error) {
      console.error(
        `[WebhookDeliveryJob] Failed to deliver webhook for ${executionId}:`,
        error,
      );
      throw error; // Let PgBoss handle retries
    }
  }
}
