import { db, usageLimits, eq } from "@repo/db";
import {
  getStripe,
  getProPriceId,
  getSuccessUrl,
  getCancelUrl,
} from "./config";
import { createStripeCustomer } from "./customer";

export interface CreateCheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Create a Stripe Checkout session for upgrading to Pro plan.
 * Following T3 pattern: Always create customer BEFORE checkout.
 */
export async function createCheckoutSession(
  organizationId: string,
  email?: string,
  name?: string,
): Promise<CreateCheckoutResult> {
  const stripe = getStripe();

  // Get or create Stripe customer
  let record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
    columns: { stripeCustomerId: true, planType: true },
  });

  if (!record) {
    throw new Error(`Organization ${organizationId} not found`);
  }

  // If already on pro, don't allow another checkout
  if (record.planType === "pro") {
    throw new Error("Organization is already on Pro plan");
  }

  let stripeCustomerId = record.stripeCustomerId;

  // Ensure we have a Stripe customer
  if (!stripeCustomerId) {
    stripeCustomerId = await createStripeCustomer(organizationId, email, name);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [
      {
        price: getProPriceId(),
        quantity: 1,
      },
    ],
    success_url: `${getSuccessUrl()}?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: getCancelUrl(),
    // Stripe will handle limiting to one subscription per customer
    subscription_data: {
      metadata: {
        organizationId,
      },
    },
    metadata: {
      organizationId,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  console.log(
    `[Stripe] Created checkout session ${session.id} for org ${organizationId}`,
  );

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe Billing Portal session for managing subscription.
 * Users can cancel, update payment method, etc.
 */
export async function createBillingPortalSession(
  organizationId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe();

  const record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
    columns: { stripeCustomerId: true },
  });

  if (!record?.stripeCustomerId) {
    throw new Error(`No Stripe customer found for org ${organizationId}`);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: record.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}
