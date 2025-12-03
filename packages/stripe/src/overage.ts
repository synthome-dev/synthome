import { db, usageLimits, eq } from "@repo/db";
import { getStripe, PLANS } from "./config";

/**
 * Calculate overage amount in cents for an organization.
 * Returns 0 if no overage or not on pro plan.
 *
 * Formula: ceil(overageActions / 1000) * 500 cents
 * Minimum overage charge: $5 (1000 actions)
 */
export function calculateOverageAmount(
  actionsUsed: number,
  monthlyLimit: number,
): number {
  const overageActions = actionsUsed - monthlyLimit;

  if (overageActions <= 0) {
    return 0;
  }

  // Round up to nearest 1000
  const overageChunks = Math.ceil(overageActions / 1000);

  // $5 per 1000 actions = 500 cents
  return overageChunks * PLANS.pro.overagePricePerThousand;
}

/**
 * Process billing period end for an organization.
 * Called when invoice.created webhook fires.
 *
 * 1. Add pendingOverageAmount from previous period to the invoice
 * 2. Calculate this period's overage and store as new pendingOverageAmount
 * 3. Reset usage counters
 */
export async function processBillingPeriodEnd(
  stripeCustomerId: string,
  invoiceId: string,
): Promise<{
  previousOverageCharged: number;
  newOverageCalculated: number;
}> {
  const stripe = getStripe();

  // Get organization data
  const record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.stripeCustomerId, stripeCustomerId),
  });

  if (!record) {
    console.error(
      `[Overage] No organization found for customer ${stripeCustomerId}`,
    );
    throw new Error(`No organization found for customer ${stripeCustomerId}`);
  }

  // Only process overage for pro plans
  if (record.planType !== "pro") {
    console.log(
      `[Overage] Skipping overage for non-pro org ${record.organizationId}`,
    );
    return { previousOverageCharged: 0, newOverageCalculated: 0 };
  }

  const previousOverageAmount = record.pendingOverageAmount || 0;

  // Step 1: Add previous period's overage to the current invoice
  if (previousOverageAmount > 0) {
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoiceId,
      amount: previousOverageAmount,
      currency: "usd",
      description: `Overage charges from previous billing period (${Math.ceil(previousOverageAmount / PLANS.pro.overagePricePerThousand) * 1000} actions)`,
    });

    console.log(
      `[Overage] Added $${(previousOverageAmount / 100).toFixed(2)} overage to invoice ${invoiceId} for org ${record.organizationId}`,
    );
  }

  // Step 2: Calculate this period's overage
  const newOverageAmount = calculateOverageAmount(
    record.actionsUsedThisPeriod,
    record.monthlyActionLimit,
  );

  // Step 3: Update database - store new overage and reset usage
  await db
    .update(usageLimits)
    .set({
      pendingOverageAmount: newOverageAmount,
      actionsUsedThisPeriod: 0,
      overageActionsThisPeriod: 0,
      updatedAt: new Date(),
    })
    .where(eq(usageLimits.stripeCustomerId, stripeCustomerId));

  console.log(
    `[Overage] Period end for org ${record.organizationId}: charged $${(previousOverageAmount / 100).toFixed(2)}, new pending $${(newOverageAmount / 100).toFixed(2)}`,
  );

  return {
    previousOverageCharged: previousOverageAmount,
    newOverageCalculated: newOverageAmount,
  };
}

/**
 * Get current overage status for an organization.
 */
export async function getOverageStatus(organizationId: string): Promise<{
  planType: "free" | "pro" | "custom";
  actionsUsed: number;
  monthlyLimit: number;
  overageActions: number;
  estimatedOverageCharge: number;
  pendingOverageFromLastPeriod: number;
  periodStart: Date;
  periodEnd: Date;
}> {
  const record = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
  });

  if (!record) {
    throw new Error(`Organization ${organizationId} not found`);
  }

  const overageActions = Math.max(
    0,
    record.actionsUsedThisPeriod - record.monthlyActionLimit,
  );
  const estimatedOverageCharge = calculateOverageAmount(
    record.actionsUsedThisPeriod,
    record.monthlyActionLimit,
  );

  return {
    planType: record.planType,
    actionsUsed: record.actionsUsedThisPeriod,
    monthlyLimit: record.monthlyActionLimit,
    overageActions,
    estimatedOverageCharge,
    pendingOverageFromLastPeriod: record.pendingOverageAmount || 0,
    periodStart: record.currentPeriodStart,
    periodEnd: record.currentPeriodEnd,
  };
}
