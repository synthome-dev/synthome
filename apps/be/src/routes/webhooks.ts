import { Hono } from "hono";
import { db, executionJobs, eq } from "@repo/db";
import { parseModelWebhook } from "@repo/model-schemas";
import { completeAsyncJob, failAsyncJob } from "@repo/jobs";

const webhooksRouter = new Hono();

/**
 * Generic webhook handler for all providers
 * Providers should POST to: /api/webhooks/job/:jobRecordId
 */
webhooksRouter.post("/job/:jobRecordId", async (c) => {
  const jobRecordId = c.req.param("jobRecordId");

  try {
    // 1. Get the job record from database
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.id, jobRecordId))
      .limit(1);

    if (!job) {
      console.error(`[Webhook] Job not found: ${jobRecordId}`);
      return c.json({ error: "Job not found" }, 404);
    }

    // 2. Extract modelId from job metadata
    const metadata = job.metadata as Record<string, unknown>;
    const modelId = metadata?.modelId as string | undefined;

    if (!modelId) {
      console.error(`[Webhook] No modelId in job metadata: ${jobRecordId}`);
      return c.json({ error: "No modelId in job metadata" }, 400);
    }

    // 3. Parse webhook payload using model-specific parser
    const payload = await c.req.json();
    console.log(
      `[Webhook] Received webhook for job ${jobRecordId}, model ${modelId}`,
    );

    const parseResult = parseModelWebhook(modelId, payload);

    // 4. Handle result based on status
    if (parseResult.status === "completed") {
      if (!parseResult.outputs || parseResult.outputs.length === 0) {
        console.error(`[Webhook] Job ${jobRecordId} completed but no outputs`);
        await failAsyncJob(jobRecordId, "No outputs received from provider");
        return c.json({ success: true, status: "failed" });
      }

      console.log(
        `[Webhook] Job ${jobRecordId} completed with ${parseResult.outputs.length} outputs`,
      );
      await completeAsyncJob(jobRecordId, parseResult.outputs);
      return c.json({ success: true, status: "completed" });
    } else if (parseResult.status === "failed") {
      console.error(
        `[Webhook] Job ${jobRecordId} failed: ${parseResult.error}`,
      );
      await failAsyncJob(jobRecordId, parseResult.error || "Unknown error");
      return c.json({ success: true, status: "failed" });
    } else if (parseResult.status === "processing") {
      console.log(`[Webhook] Job ${jobRecordId} still processing`);
      return c.json({ success: true, status: "processing" });
    } else {
      console.warn(
        `[Webhook] Unknown status for job ${jobRecordId}: ${parseResult.status}`,
      );
      return c.json({ success: true, status: "unknown" });
    }
  } catch (error) {
    console.error(
      `[Webhook] Error processing webhook for job ${jobRecordId}:`,
      error,
    );

    // Try to mark job as failed
    try {
      await failAsyncJob(
        jobRecordId,
        error instanceof Error ? error.message : "Webhook processing error",
      );
    } catch (failError) {
      console.error(`[Webhook] Error marking job as failed:`, failError);
    }

    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { webhooksRouter };
