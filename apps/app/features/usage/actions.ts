"use server";

import { auth } from "@clerk/nextjs/server";
import { db, executionJobs, usageLimits, eq, sql, and } from "@repo/db";
import { gte, lte } from "drizzle-orm";

export interface DailyUsageData {
  date: string; // YYYY-MM-DD format
  count: number;
  cost: number;
}

export interface BillingPeriodInfo {
  periodStart: Date;
  periodEnd: Date;
  includedActions: number;
  overageActions: number;
  overageCost: number;
  isOverage: boolean;
}

export interface MonthlyUsageStats {
  dailyData: DailyUsageData[];
  monthlyTotal: number;
  monthlyCost: number;
  todayTotal: number;
  todayCost: number;
  maxDailyCount: number;
  planType: "free" | "pro" | "custom";
  billingPeriod: BillingPeriodInfo;
}

const COST_PER_ACTION = 50 / 10000; // $0.005 per execution job
const PRO_INCLUDED_ACTIONS = 10000;
const OVERAGE_PRICE_PER_1000 = 5; // $5 per 1,000 actions

/**
 * Get execution jobs usage for the current billing period.
 * Uses the billing period stored in usageLimits (currentPeriodStart/End).
 * - Free users: 30-day rolling periods
 * - Pro users: Stripe subscription billing periods
 * Returns daily breakdown with overage calculations for Pro users.
 */
export async function getMonthlyUsageStats(): Promise<{
  success: boolean;
  data?: MonthlyUsageStats;
  error?: string;
}> {
  const { orgId } = await auth();

  if (!orgId) {
    return {
      success: false,
      error: "No organization found. Please select an organization.",
    };
  }

  try {
    // Get user's plan and billing period info
    const [userLimits] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.organizationId, orgId));

    const planType = userLimits?.planType || "free";
    const now = new Date();

    // Determine billing period boundaries
    // Both Free and Pro users have billing periods stored in usageLimits
    let periodStart: Date;
    let periodEnd: Date;
    let includedActions: number;

    if (userLimits?.currentPeriodStart && userLimits?.currentPeriodEnd) {
      // Use stored billing period
      periodStart = new Date(userLimits.currentPeriodStart);
      periodEnd = new Date(userLimits.currentPeriodEnd);
      includedActions = userLimits.monthlyActionLimit;
    } else {
      // Fallback to calendar month if no billing period exists
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      periodEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      includedActions = planType === "pro" ? PRO_INCLUDED_ACTIONS : 2000;
    }

    // Ensure we don't query beyond today
    const today = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const queryEnd = periodEnd < today ? periodEnd : today;

    // Query execution jobs grouped by day within billing period
    const results = await db
      .select({
        date: sql<string>`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(executionJobs)
      .where(
        and(
          eq(executionJobs.organizationId, orgId),
          gte(executionJobs.createdAt, periodStart),
          lte(executionJobs.createdAt, queryEnd),
        ),
      )
      .groupBy(sql`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(sql`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`);

    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    results.forEach((row) => {
      dataMap.set(row.date, Number(row.count));
    });

    // Generate array with all days in the billing period
    const dailyData: DailyUsageData[] = [];
    let periodTotal = 0;
    let todayTotal = 0;
    let maxDailyCount = 0;

    // Iterate through each day in the billing period
    const currentDate = new Date(periodStart);
    while (currentDate <= periodEnd) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const count = dataMap.get(dateStr) || 0;

      // Calculate cost: only overage costs for Pro, nothing for Free
      let dayCost = 0;
      if (planType === "pro") {
        // Running total to determine if this day's usage goes into overage
        const previousTotal = periodTotal;
        const newTotal = previousTotal + count;

        if (newTotal > includedActions) {
          // Some or all of this day's usage is overage
          const overageCount =
            newTotal - Math.max(previousTotal, includedActions);
          dayCost = (overageCount / 1000) * OVERAGE_PRICE_PER_1000;
        }
      }

      dailyData.push({
        date: dateStr,
        count,
        cost: dayCost,
      });

      // Only count past and current day in totals
      if (currentDate <= today) {
        periodTotal += count;
        maxDailyCount = Math.max(maxDailyCount, count);
      }

      // Check if this is today
      if (
        currentDate.getUTCDate() === now.getUTCDate() &&
        currentDate.getUTCMonth() === now.getUTCMonth() &&
        currentDate.getUTCFullYear() === now.getUTCFullYear()
      ) {
        todayTotal = count;
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Calculate overage info
    const overageActions = Math.max(0, periodTotal - includedActions);
    const overageCost = (overageActions / 1000) * OVERAGE_PRICE_PER_1000;
    const isOverage = overageActions > 0;

    // Total cost for the period (only overage for Pro, 0 for Free)
    const periodCost = planType === "pro" ? overageCost : 0;
    const todayCost = planType === "free" ? 0 : todayTotal * COST_PER_ACTION;

    return {
      success: true,
      data: {
        dailyData,
        monthlyTotal: periodTotal,
        monthlyCost: periodCost,
        todayTotal,
        todayCost,
        maxDailyCount,
        planType,
        billingPeriod: {
          periodStart,
          periodEnd,
          includedActions,
          overageActions,
          overageCost,
          isOverage,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching monthly usage stats:", error);
    return {
      success: false,
      error: "Failed to fetch usage statistics. Please try again.",
    };
  }
}
