import { db, usageLimits, eq } from "@repo/db";
import type Stripe from "stripe";
import { getStripe, PLANS } from "./config";

export interface SubscriptionData {
  subscriptionId: string | null;
  status: Stripe.Subscription.Status | "none";
  priceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Sync Stripe subscription data to our database.
 * This is the single source of truth function - called from:
 * 1. /success endpoint after checkout
 * 2. All relevant Stripe webhook events
 *
 * Following T3 pattern: single sync function prevents split-brain state.
 */
export async function syncStripeData(
  stripeCustomerId: string,
): Promise<SubscriptionData> {
  const stripe = getStripe();

  // Fetch latest subscription data from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 1,
    status: "all",
    expand: ["data.default_payment_method"],
  });

  // Get the organization for this customer
  const orgRecord = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.stripeCustomerId, stripeCustomerId),
  });

  if (!orgRecord) {
    console.error(
      `[Stripe Sync] No organization found for customer ${stripeCustomerId}`,
    );
    throw new Error(`No organization found for customer ${stripeCustomerId}`);
  }

  if (subscriptions.data.length === 0) {
    // No subscription - user is on free plan
    const subData: SubscriptionData = {
      subscriptionId: null,
      status: "none",
      priceId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    // If they had a subscription before but it's gone, downgrade to free
    if (orgRecord.planType !== "free") {
      await downgradeToFree(orgRecord.organizationId);
    }

    await db
      .update(usageLimits)
      .set({
        stripeSubscriptionId: null,
        subscriptionStatus: "none",
        stripePriceId: null,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(usageLimits.stripeCustomerId, stripeCustomerId));

    console.log(
      `[Stripe Sync] No subscription for customer ${stripeCustomerId}, on free plan`,
    );
    return subData;
  }

  // Get the subscription (we only allow one per customer)
  const subscription = subscriptions.data[0]!;

  const subData: SubscriptionData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? null,
    currentPeriodStart: new Date(
      (subscription as any).current_period_start * 1000,
    ),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  // Determine plan type based on subscription status
  const isActiveSub =
    subscription.status === "active" || subscription.status === "trialing";

  // Update database with subscription data
  await db
    .update(usageLimits)
    .set({
      stripeSubscriptionId: subData.subscriptionId,
      subscriptionStatus: subData.status,
      stripePriceId: subData.priceId,
      currentPeriodStart: subData.currentPeriodStart!,
      currentPeriodEnd: subData.currentPeriodEnd!,
      cancelAtPeriodEnd: subData.cancelAtPeriodEnd,
      // If subscription is active and was free, upgrade to pro
      ...(isActiveSub && orgRecord.planType === "free"
        ? {
            planType: "pro" as const,
            monthlyActionLimit: PLANS.pro.monthlyActionLimit,
            overageAllowed: true,
            overagePricePerAction: "0.005", // $5 per 1000 = $0.005 per action
            // Reset usage on upgrade (fresh start)
            actionsUsedThisPeriod: 0,
            overageActionsThisPeriod: 0,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(usageLimits.stripeCustomerId, stripeCustomerId));

  console.log(
    `[Stripe Sync] Synced subscription ${subscription.id} for customer ${stripeCustomerId}, status: ${subscription.status}`,
  );

  return subData;
}

/**
 * Sync Stripe data by organization ID.
 * Convenience wrapper that looks up the customer ID first.
 */
export async function syncStripeDataByOrg(
  organizationId: string,
): Promise<SubscriptionData | null> {
  const record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
    columns: { stripeCustomerId: true },
  });

  if (!record?.stripeCustomerId) {
    console.warn(
      `[Stripe Sync] No Stripe customer found for org ${organizationId}`,
    );
    return null;
  }

  return syncStripeData(record.stripeCustomerId);
}

/**
 * Downgrade an organization to the free plan.
 */
async function downgradeToFree(organizationId: string): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  await db
    .update(usageLimits)
    .set({
      planType: "free",
      monthlyActionLimit: PLANS.free.monthlyActionLimit,
      overageAllowed: false,
      overagePricePerAction: null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      actionsUsedThisPeriod: 0,
      overageActionsThisPeriod: 0,
      pendingOverageAmount: 0, // Clear any pending overage
      updatedAt: now,
    })
    .where(eq(usageLimits.organizationId, organizationId));

  console.log(`[Stripe Sync] Downgraded org ${organizationId} to free plan`);
}
