import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { initializeUsageLimits, getCurrentUsage } from "@repo/db";
import { providerKeyService, storageIntegrationService } from "@repo/api-keys";
import { createStripeCustomer } from "@repo/stripe";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    name?: string;
    [key: string]: unknown;
  };
}

/**
 * POST /api/webhooks/clerk
 *
 * Handles Clerk organization lifecycle events.
 * On organization.created:
 *   1. Initialize usage limits (free plan)
 *   2. Initialize provider keys
 *   3. Initialize storage integration
 *   4. Create Stripe customer
 */
export async function POST(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error(
      "[Clerk Webhook] CLERK_WEBHOOK_SIGNING_SECRET not configured",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("[Clerk Webhook] Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 },
    );
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  // Handle organization.created event
  if (evt.type === "organization.created") {
    const organizationId = evt.data.id;
    const organizationName = evt.data.name;

    console.log(
      `[Clerk Webhook] Received organization.created event for org: ${organizationId}`,
    );

    // Check if organization already has usage limits (idempotency)
    const existingLimits = await getCurrentUsage(organizationId);

    if (existingLimits) {
      console.log(
        `[Clerk Webhook] Organization ${organizationId} already has usage limits, skipping initialization`,
      );
      return NextResponse.json({
        success: true,
        message: "Organization already initialized",
      });
    }

    try {
      // 1. Initialize usage limits with free plan
      await initializeUsageLimits(organizationId, "free");
      console.log(
        `[Clerk Webhook] Initialized usage limits for org ${organizationId}`,
      );

      // 2. Initialize empty provider key records
      await providerKeyService.initializeProviderKeys(organizationId);
      console.log(
        `[Clerk Webhook] Initialized provider keys for org ${organizationId}`,
      );

      // 3. Initialize empty storage integration record
      await storageIntegrationService.initializeStorageIntegration(
        organizationId,
      );
      console.log(
        `[Clerk Webhook] Initialized storage integration for org ${organizationId}`,
      );

      // 4. Create Stripe customer for billing
      let stripeCustomerId: string | null = null;
      try {
        stripeCustomerId = await createStripeCustomer(
          organizationId,
          undefined, // email not available in org.created event
          organizationName,
        );
        console.log(
          `[Clerk Webhook] Created Stripe customer ${stripeCustomerId} for org ${organizationId}`,
        );
      } catch (stripeError) {
        // Log but don't fail - Stripe customer can be created later during checkout
        console.error(
          `[Clerk Webhook] Failed to create Stripe customer for org ${organizationId}:`,
          stripeError,
        );
      }

      return NextResponse.json({
        success: true,
        message: "Organization initialized",
        organizationId,
        planType: "free",
        stripeCustomerId,
      });
    } catch (error) {
      console.error(
        `[Clerk Webhook] Failed to initialize org ${organizationId}:`,
        error,
      );
      return NextResponse.json(
        {
          error: "Failed to initialize organization",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  }

  // For other event types, just acknowledge receipt
  console.log(
    `[Clerk Webhook] Received event type: ${evt.type}, no action taken`,
  );
  return NextResponse.json({
    success: true,
    message: "Webhook received",
    eventType: evt.type,
  });
}
