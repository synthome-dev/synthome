import { db } from "../db";
import { executions } from "../db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import crypto from "crypto";

interface WebhookPayload {
  executionId: string;
  status: "completed" | "failed";
  result: any | null;
  error: string | null;
  completedAt: string;
}

const MAX_RETRY_ATTEMPTS = 5;

/**
 * Find executions that need webhook delivery
 */
export async function findPendingWebhooks() {
  const pendingExecutions = await db
    .select()
    .from(executions)
    .where(
      and(
        // Execution is completed or failed
        eq(executions.status, "completed"),
        // Has a webhook URL
        sql`${executions.webhook} IS NOT NULL`,
        // Webhook not yet delivered
        sql`${executions.webhookDeliveredAt} IS NULL`,
        // Haven't exceeded retry limit
        lt(executions.webhookDeliveryAttempts, MAX_RETRY_ATTEMPTS),
      ),
    );

  // Also get failed executions
  const failedExecutions = await db
    .select()
    .from(executions)
    .where(
      and(
        eq(executions.status, "failed"),
        sql`${executions.webhook} IS NOT NULL`,
        sql`${executions.webhookDeliveredAt} IS NULL`,
        lt(executions.webhookDeliveryAttempts, MAX_RETRY_ATTEMPTS),
      ),
    );

  return [...pendingExecutions, ...failedExecutions];
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Deliver webhook to the provided URL
 */
export async function deliverWebhook(execution: {
  id: string;
  status: string;
  result: any;
  error: string | null;
  completedAt: Date | null;
  webhook: string | null;
  webhookSecret: string | null;
  webhookDeliveryAttempts: number | null;
}): Promise<{ success: boolean; error?: string }> {
  if (!execution.webhook) {
    return { success: false, error: "No webhook URL provided" };
  }

  const payload: WebhookPayload = {
    executionId: execution.id,
    status: execution.status as "completed" | "failed",
    result: execution.result,
    error: execution.error,
    completedAt:
      execution.completedAt?.toISOString() || new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "OpenVideo-Webhooks/1.0",
  };

  // Add signature if secret is provided
  if (execution.webhookSecret) {
    headers["X-Webhook-Signature"] = generateSignature(
      payloadString,
      execution.webhookSecret,
    );
  }

  const currentAttempt = (execution.webhookDeliveryAttempts || 0) + 1;

  try {
    console.log(
      `[WebhookService] Delivering webhook to ${execution.webhook} (attempt ${currentAttempt}/${MAX_RETRY_ATTEMPTS})`,
    );

    const response = await fetch(execution.webhook, {
      method: "POST",
      headers,
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      const error = `Webhook delivery failed: ${response.status} ${response.statusText} - ${errorText}`;
      console.error(`[WebhookService] ${error}`);

      // Update delivery attempt and error
      await db
        .update(executions)
        .set({
          webhookDeliveryAttempts: currentAttempt,
          webhookDeliveryError: error.substring(0, 500), // Limit error message length
        })
        .where(eq(executions.id, execution.id));

      return { success: false, error };
    }

    // Success - mark as delivered
    await db
      .update(executions)
      .set({
        webhookDeliveredAt: new Date(),
        webhookDeliveryAttempts: currentAttempt,
        webhookDeliveryError: null,
      })
      .where(eq(executions.id, execution.id));

    console.log(
      `[WebhookService] ✅ Webhook delivered successfully to ${execution.webhook}`,
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[WebhookService] Failed to deliver webhook: ${errorMessage}`,
    );

    // Update delivery attempt and error
    await db
      .update(executions)
      .set({
        webhookDeliveryAttempts: currentAttempt,
        webhookDeliveryError: errorMessage.substring(0, 500),
      })
      .where(eq(executions.id, execution.id));

    return { success: false, error: errorMessage };
  }
}

/**
 * Process all pending webhooks
 */
export async function processWebhookDeliveries(): Promise<{
  delivered: number;
  failed: number;
  errors: string[];
}> {
  const pendingWebhooks = await findPendingWebhooks();

  console.log(
    `[WebhookService] Found ${pendingWebhooks.length} pending webhooks to deliver`,
  );

  let delivered = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const execution of pendingWebhooks) {
    const result = await deliverWebhook(execution);

    if (result.success) {
      delivered++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`Execution ${execution.id}: ${result.error}`);
      }
    }
  }

  return { delivered, failed, errors };
}
