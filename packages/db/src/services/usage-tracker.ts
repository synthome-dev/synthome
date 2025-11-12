import { generateId } from "@repo/tools";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index";
import { actionLogs, usageLimits } from "../db/schema";

export interface LogActionParams {
  organizationId: string;
  apiKeyId: string;
  actionType: string;
  actionCount?: number;
  executionId?: string;
  jobId?: string;
  isOverage: boolean;
  estimatedCost?: string;
  metadata?: Record<string, any>;
}

export interface IncrementUsageParams {
  organizationId: string;
  actionCount: number;
  isOverage: boolean;
}

/**
 * Log an action to the action_logs table and increment usage counters.
 * This should be called after a job completes successfully.
 */
export async function logAction(params: LogActionParams): Promise<string> {
  const {
    organizationId,
    apiKeyId,
    actionType,
    actionCount = 1,
    executionId,
    jobId,
    isOverage,
    estimatedCost,
    metadata = {},
  } = params;

  // Insert the action log
  const [actionLog] = await db
    .insert(actionLogs)
    .values({
      id: generateId(),
      organizationId,
      apiKeyId,
      actionType,
      actionCount,
      executionId: executionId || null,
      jobId: jobId || null,
      isOverage,
      estimatedCost: estimatedCost || null,
      metadata,
    })
    .returning({ id: actionLogs.id });

  // Increment the usage counters
  await incrementUsage({
    organizationId,
    actionCount,
    isOverage,
  });

  return actionLog.id;
}

/**
 * Increment usage counters atomically using SQL.
 * Increments either actionsUsedThisPeriod or overageActionsThisPeriod.
 */
export async function incrementUsage(
  params: IncrementUsageParams
): Promise<void> {
  const { organizationId, actionCount, isOverage } = params;

  if (isOverage) {
    // Increment overage counter
    await db
      .update(usageLimits)
      .set({
        overageActionsThisPeriod: sql`${usageLimits.overageActionsThisPeriod} + ${actionCount}`,
        updatedAt: new Date(),
      })
      .where(eq(usageLimits.organizationId, organizationId));
  } else {
    // Increment regular usage counter
    await db
      .update(usageLimits)
      .set({
        actionsUsedThisPeriod: sql`${usageLimits.actionsUsedThisPeriod} + ${actionCount}`,
        updatedAt: new Date(),
      })
      .where(eq(usageLimits.organizationId, organizationId));
  }
}

/**
 * Check if an action should be counted as overage based on current usage.
 * Returns true if the organization has exceeded their monthly limit.
 *
 * Note: For free plans, we should block at the limit (handled by rate limiter).
 * This is primarily for Pro plans with overage allowed.
 */
export async function checkIfOverage(organizationId: string): Promise<boolean> {
  const [limits] = await db
    .select({
      actionsUsedThisPeriod: usageLimits.actionsUsedThisPeriod,
      monthlyActionLimit: usageLimits.monthlyActionLimit,
      isUnlimited: usageLimits.isUnlimited,
      overageAllowed: usageLimits.overageAllowed,
    })
    .from(usageLimits)
    .where(eq(usageLimits.organizationId, organizationId));

  if (!limits) {
    throw new Error(
      `Usage limits not found for organization: ${organizationId}`
    );
  }

  // Unlimited plans never have overage
  if (limits.isUnlimited) {
    return false;
  }

  // If overage is not allowed, we shouldn't even get here (rate limiter blocks)
  if (!limits.overageAllowed) {
    return false;
  }

  // Check if we've exceeded the monthly limit
  return limits.actionsUsedThisPeriod >= limits.monthlyActionLimit;
}

/**
 * Calculate the estimated cost for an overage action.
 * Returns null if not an overage action or no price configured.
 */
export async function calculateOverageCost(
  organizationId: string,
  actionCount: number = 1
): Promise<string | null> {
  const [limits] = await db
    .select({
      overagePricePerAction: usageLimits.overagePricePerAction,
    })
    .from(usageLimits)
    .where(eq(usageLimits.organizationId, organizationId));

  if (!limits?.overagePricePerAction) {
    return null;
  }

  const price = parseFloat(limits.overagePricePerAction);
  const cost = price * actionCount;

  return cost.toFixed(4);
}
