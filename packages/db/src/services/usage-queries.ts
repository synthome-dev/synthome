import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { usageLimits, actionLogs } from "../db/schema.js";

export interface UsageLimitsInfo {
  id: string;
  organizationId: string;
  planType: "free" | "pro" | "custom";
  monthlyActionLimit: number;
  isUnlimited: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  actionsUsedThisPeriod: number;
  overageAllowed: boolean;
  overagePricePerAction: string | null;
  overageActionsThisPeriod: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionLogInfo {
  id: string;
  organizationId: string;
  apiKeyId: string;
  executionId: string | null;
  jobId: string | null;
  actionType: string;
  actionCount: number;
  isOverage: boolean;
  estimatedCost: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface UsageByActionType {
  actionType: string;
  totalActions: number;
  overageActions: number;
  regularActions: number;
  totalCost: string;
}

export interface GetUsageHistoryParams {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  apiKeyId?: string;
  actionType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get current usage limits and period info for an organization.
 */
export async function getCurrentUsage(
  organizationId: string,
): Promise<UsageLimitsInfo | null> {
  const [limits] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.organizationId, organizationId));

  return limits || null;
}

/**
 * Get action logs with optional filters.
 * Returns paginated results ordered by most recent first.
 */
export async function getUsageHistory(
  params: GetUsageHistoryParams,
): Promise<ActionLogInfo[]> {
  const {
    organizationId,
    startDate,
    endDate,
    apiKeyId,
    actionType,
    limit = 100,
    offset = 0,
  } = params;

  const conditions = [eq(actionLogs.organizationId, organizationId)];

  if (startDate) {
    conditions.push(gte(actionLogs.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(actionLogs.createdAt, endDate));
  }

  if (apiKeyId) {
    conditions.push(eq(actionLogs.apiKeyId, apiKeyId));
  }

  if (actionType) {
    conditions.push(eq(actionLogs.actionType, actionType));
  }

  const logs = await db
    .select()
    .from(actionLogs)
    .where(and(...conditions))
    .orderBy(desc(actionLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return logs.map((log) => ({
    ...log,
    metadata: log.metadata || {},
  }));
}

/**
 * Get aggregated usage stats by action type for an organization.
 * Optionally filter by date range.
 */
export async function getUsageByActionType(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<UsageByActionType[]> {
  const conditions = [eq(actionLogs.organizationId, organizationId)];

  if (startDate) {
    conditions.push(gte(actionLogs.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(actionLogs.createdAt, endDate));
  }

  const results = await db
    .select({
      actionType: actionLogs.actionType,
      totalActions: sql<number>`SUM(${actionLogs.actionCount})`,
      overageActions: sql<number>`SUM(CASE WHEN ${actionLogs.isOverage} THEN ${actionLogs.actionCount} ELSE 0 END)`,
      regularActions: sql<number>`SUM(CASE WHEN NOT ${actionLogs.isOverage} THEN ${actionLogs.actionCount} ELSE 0 END)`,
      totalCost: sql<string>`COALESCE(SUM(${actionLogs.estimatedCost}), 0)`,
    })
    .from(actionLogs)
    .where(and(...conditions))
    .groupBy(actionLogs.actionType);

  return results.map((r) => ({
    actionType: r.actionType,
    totalActions: Number(r.totalActions),
    overageActions: Number(r.overageActions),
    regularActions: Number(r.regularActions),
    totalCost: r.totalCost,
  }));
}

/**
 * Get usage limits for an organization.
 * If not found, returns null (organization needs to be initialized).
 */
export async function getUsageLimits(
  organizationId: string,
): Promise<UsageLimitsInfo | null> {
  return getCurrentUsage(organizationId);
}

/**
 * Check if an organization can perform an action based on their limits.
 * Returns { allowed: boolean, reason?: string, isOverage: boolean }
 */
export async function checkUsageAllowed(organizationId: string): Promise<{
  allowed: boolean;
  reason?: string;
  isOverage: boolean;
}> {
  const limits = await getCurrentUsage(organizationId);

  if (!limits) {
    return {
      allowed: false,
      reason: "Organization not found or usage limits not initialized",
      isOverage: false,
    };
  }

  // Unlimited plans always allowed
  if (limits.isUnlimited) {
    return { allowed: true, isOverage: false };
  }

  // Check if we're within the monthly limit
  if (limits.actionsUsedThisPeriod < limits.monthlyActionLimit) {
    return { allowed: true, isOverage: false };
  }

  // We've exceeded the limit - check if overage is allowed
  if (limits.overageAllowed) {
    return { allowed: true, isOverage: true };
  }

  // Free plan or Pro plan without overage - hard limit reached
  return {
    allowed: false,
    reason: `Monthly action limit of ${limits.monthlyActionLimit} reached. Resets on ${limits.currentPeriodEnd.toISOString()}`,
    isOverage: false,
  };
}

/**
 * Get total usage stats for the current period.
 */
export async function getCurrentPeriodStats(organizationId: string): Promise<{
  totalActions: number;
  overageActions: number;
  regularActions: number;
  totalCost: string;
  limit: number;
  percentUsed: number;
} | null> {
  const limits = await getCurrentUsage(organizationId);

  if (!limits) {
    return null;
  }

  const totalActions =
    limits.actionsUsedThisPeriod + limits.overageActionsThisPeriod;
  const regularActions = limits.actionsUsedThisPeriod;
  const overageActions = limits.overageActionsThisPeriod;

  // Calculate total cost for overage actions
  let totalCost = "0.0000";
  if (overageActions > 0 && limits.overagePricePerAction) {
    const price = parseFloat(limits.overagePricePerAction);
    totalCost = (price * overageActions).toFixed(4);
  }

  const percentUsed = limits.isUnlimited
    ? 0
    : (regularActions / limits.monthlyActionLimit) * 100;

  return {
    totalActions,
    overageActions,
    regularActions,
    totalCost,
    limit: limits.monthlyActionLimit,
    percentUsed: Math.min(100, percentUsed),
  };
}
