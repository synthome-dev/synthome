import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "./config";
import { syncStripeData } from "./sync";
import { processBillingPeriodEnd } from "./overage";
import { db, usageLimits, eq } from "@repo/db";

/**
 * Events we track for subscription state changes.
 * Following T3 pattern: sync on all relevant events.
 */
const SUBSCRIPTION_EVENTS: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

/**
 * Events for billing/overage processing.
 */
const BILLING_EVENTS: Stripe.Event.Type[] = ["invoice.created"];

/**
 * Verify and construct a Stripe webhook event.
 */
export function constructWebhookEvent(
  payload: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, getWebhookSecret());
}

/**
 * Process a Stripe webhook event.
 * This is the main entry point for all Stripe webhooks.
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Handle subscription-related events by syncing data
  if (SUBSCRIPTION_EVENTS.includes(event.type)) {
    await handleSubscriptionEvent(event);
  }

  // Handle billing/overage events
  if (BILLING_EVENTS.includes(event.type)) {
    await handleBillingEvent(event);
  }
}

/**
 * Handle subscription events by syncing Stripe data to our database.
 */
async function handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
  // Extract customer ID from the event
  const eventObject = event.data.object as {
    customer?: string | Stripe.Customer;
  };

  let customerId: string | null = null;

  if (typeof eventObject.customer === "string") {
    customerId = eventObject.customer;
  } else if (eventObject.customer && typeof eventObject.customer === "object") {
    customerId = eventObject.customer.id;
  }

  // For checkout.session.completed, customer might be in a different field
  if (!customerId && event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (typeof session.customer === "string") {
      customerId = session.customer;
    }
  }

  if (!customerId) {
    console.warn(
      `[Stripe Webhook] No customer ID found in event ${event.type}`,
    );
    return;
  }

  try {
    await syncStripeData(customerId);
    console.log(
      `[Stripe Webhook] Synced data for customer ${customerId} after ${event.type}`,
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error syncing data for customer ${customerId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Handle billing events (invoice.created) for overage processing.
 */
async function handleBillingEvent(event: Stripe.Event): Promise<void> {
  if (event.type !== "invoice.created") {
    return;
  }

  const invoice = event.data.object as Stripe.Invoice;

  // Only process subscription invoices (not one-time payments)
  if (!(invoice as any).subscription) {
    console.log(
      `[Stripe Webhook] Skipping non-subscription invoice ${invoice.id}`,
    );
    return;
  }

  // Skip draft invoices - we want to add items when invoice is being finalized
  // Actually, invoice.created is the right time to add items before finalization
  if (invoice.status !== "draft") {
    console.log(
      `[Stripe Webhook] Skipping non-draft invoice ${invoice.id} (status: ${invoice.status})`,
    );
    return;
  }

  let customerId: string | null = null;
  if (typeof invoice.customer === "string") {
    customerId = invoice.customer;
  } else if (invoice.customer) {
    customerId = invoice.customer.id;
  }

  if (!customerId) {
    console.warn(
      `[Stripe Webhook] No customer ID found in invoice ${invoice.id}`,
    );
    return;
  }

  try {
    const result = await processBillingPeriodEnd(customerId, invoice.id!);
    console.log(
      `[Stripe Webhook] Processed billing period end for invoice ${invoice.id}:`,
      result,
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error processing billing period end for invoice ${invoice.id}:`,
      error,
    );
    throw error;
  }
}

/**
 * Handle subscription cancellation at period end.
 * When cancelAtPeriodEnd is true and period ends, downgrade to free.
 */
export async function handleSubscriptionEnded(
  stripeCustomerId: string,
): Promise<void> {
  const record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.stripeCustomerId, stripeCustomerId),
  });

  if (!record) {
    console.warn(
      `[Stripe Webhook] No organization found for customer ${stripeCustomerId}`,
    );
    return;
  }

  // Sync will handle the downgrade if subscription is truly gone
  await syncStripeData(stripeCustomerId);
}
