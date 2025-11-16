import { Hono } from "hono";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { initializeUsageLimits } from "@repo/db";
import { providerKeyService } from "@repo/api-keys";

const clerkWebhooksRouter = new Hono();

/**
 * POST /api/clerk-webhooks
 *
 * Handles Clerk organization lifecycle events.
 * Currently handles:
 * - organization.created: Automatically creates usage limits for new organizations
 *
 * Webhook signature verification is performed using Clerk's signing secret.
 */
clerkWebhooksRouter.post("/", async (c) => {
  try {
    // Get the webhook signing secret from environment
    const webhookSecret = Bun.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!webhookSecret) {
      console.error(
        "[ClerkWebhook] CLERK_WEBHOOK_SIGNING_SECRET not configured",
      );
      return c.json({ error: "Webhook secret not configured" }, 500);
    }

    // Verify the webhook signature
    // Note: Clerk's verifyWebhook expects a standard Request object
    let evt;

    try {
      evt = await verifyWebhook(c.req.raw, {
        signingSecret: webhookSecret,
      });
    } catch (err) {
      console.error(
        "[ClerkWebhook] Webhook signature verification failed:",
        err,
      );
      return c.json({ error: "Invalid webhook signature" }, 400);
    }

    // Handle the organization.created event
    if (evt.type === "organization.created") {
      const organizationId = evt.data.id as string;

      console.log(
        `[ClerkWebhook] Received organization.created event for org: ${organizationId}`,
      );

      // Check if organization already has usage limits (idempotency)
      const { getCurrentUsage } = await import("@repo/db");
      const existingLimits = await getCurrentUsage(organizationId);

      if (existingLimits) {
        console.log(
          `[ClerkWebhook] Organization ${organizationId} already has usage limits, skipping initialization`,
        );
        return c.json({
          success: true,
          message: "Organization already initialized",
        });
      }

      // Initialize usage limits with free plan as default
      try {
        await initializeUsageLimits(organizationId, "free");
        console.log(
          `[ClerkWebhook] Successfully initialized usage limits for organization ${organizationId}`,
        );

        // Initialize empty provider key records
        await providerKeyService.initializeProviderKeys(organizationId);
        console.log(
          `[ClerkWebhook] Successfully initialized provider keys for organization ${organizationId}`,
        );

        return c.json({
          success: true,
          message: "Organization usage limits initialized",
          organizationId,
          planType: "free",
        });
      } catch (error) {
        console.error(
          `[ClerkWebhook] Failed to initialize usage limits for org ${organizationId}:`,
          error,
        );
        return c.json(
          {
            error: "Failed to initialize usage limits",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          500,
        );
      }
    }

    // For other event types, just acknowledge receipt
    console.log(
      `[ClerkWebhook] Received event type: ${evt.type}, no action taken`,
    );
    return c.json({
      success: true,
      message: "Webhook received",
      eventType: evt.type,
    });
  } catch (error) {
    console.error("[ClerkWebhook] Unexpected error processing webhook:", error);
    return c.json(
      {
        error: "Webhook processing error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { clerkWebhooksRouter };
