import { db, usageLimits, sql } from "@repo/db";

/**
 * Reset usage counters for FREE plan organizations at the start of each billing period.
 * This should be run as a scheduled job (daily to catch expired periods).
 *
 * Note: Pro plan users have their usage reset via Stripe webhooks (invoice.created)
 * This function only handles Free plan users who don't have Stripe subscriptions.
 *
 * For each FREE organization:
 * 1. Reset actionsUsedThisPeriod to 0
 * 2. Reset overageActionsThisPeriod to 0
 * 3. Update currentPeriodStart to now
 * 4. Update currentPeriodEnd to now + 30 days
 */
export async function resetMonthlyUsage(): Promise<{
  resetCount: number;
  errors: Array<{ organizationId: string; error: string }>;
}> {
  console.log(
    "[ResetMonthlyUsage] Starting monthly usage reset for free plans...",
  );

  // Get all FREE plan usage limits that need resetting (where current period has ended)
  // Pro plans are handled by Stripe webhooks
  const now = new Date();
  const limitsToReset = await db.query.usageLimits.findMany({
    where: sql`${usageLimits.currentPeriodEnd} <= ${now} AND ${usageLimits.planType} = 'free'`,
  });

  console.log(
    `[ResetMonthlyUsage] Found ${limitsToReset.length} free plan organizations to reset`,
  );

  const errors: Array<{ organizationId: string; error: string }> = [];
  let resetCount = 0;

  for (const limit of limitsToReset) {
    try {
      const newPeriodStart = now;
      const newPeriodEnd = new Date(now);
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

      await db
        .update(usageLimits)
        .set({
          actionsUsedThisPeriod: 0,
          overageActionsThisPeriod: 0,
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          updatedAt: now,
        })
        .where(sql`${usageLimits.id} = ${limit.id}`);

      resetCount++;

      console.log(
        `[ResetMonthlyUsage] Reset usage for organization ${limit.organizationId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[ResetMonthlyUsage] Error resetting organization ${limit.organizationId}:`,
        error,
      );
      errors.push({
        organizationId: limit.organizationId,
        error: errorMessage,
      });
    }
  }

  console.log(
    `[ResetMonthlyUsage] Completed. Reset ${resetCount} organizations, ${errors.length} errors`,
  );

  return { resetCount, errors };
}

/**
 * Initialize usage limits for a new organization.
 * This should be called when a new organization signs up.
 */
export async function initializeUsageLimits(
  organizationId: string,
  planType: "free" | "pro" | "custom" = "free",
): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  // Default limits by plan type
  const planDefaults = {
    free: {
      monthlyActionLimit: 2000,
      isUnlimited: false,
      overageAllowed: false,
      overagePricePerAction: null,
    },
    pro: {
      monthlyActionLimit: 10000,
      isUnlimited: false,
      overageAllowed: true,
      overagePricePerAction: "0.0010", // $0.001 per action
    },
    custom: {
      monthlyActionLimit: 50000,
      isUnlimited: true,
      overageAllowed: false,
      overagePricePerAction: null,
    },
  };

  const config = planDefaults[planType];

  await db.insert(usageLimits).values({
    id: `ul_${organizationId}`,
    organizationId,
    planType,
    monthlyActionLimit: config.monthlyActionLimit,
    isUnlimited: config.isUnlimited,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    actionsUsedThisPeriod: 0,
    overageAllowed: config.overageAllowed,
    overagePricePerAction: config.overagePricePerAction,
    overageActionsThisPeriod: 0,
  });

  console.log(
    `[InitializeUsageLimits] Initialized ${planType} plan for organization ${organizationId}`,
  );
}
