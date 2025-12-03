import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, processWebhookEvent } from "@repo/stripe";

/**
 * POST /api/stripe/webhook
 *
 * Stripe webhook endpoint.
 * Handles all Stripe events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Get raw body for signature verification
    const body = await request.text();

    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Process the event
    // Note: In Next.js we process synchronously since we can't use waitUntil easily
    // For production, consider using a queue (like Inngest) for reliability
    try {
      await processWebhookEvent(event);
      console.log(`[Stripe Webhook] Processed event: ${event.type}`);
    } catch (error) {
      console.error("[Stripe Webhook] Error processing event:", error);
      // Still return 200 to acknowledge receipt, but log the error
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
