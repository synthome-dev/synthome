"use server";

import { auth } from "@clerk/nextjs/server";
import { db, executionJobs, usageLimits, eq, sql, and } from "@repo/db";
import { gte, lte } from "drizzle-orm";

export interface DailyUsageData {
  date: string; // YYYY-MM-DD format
  count: number;
  cost: number;
}

export interface MonthlyUsageStats {
  dailyData: DailyUsageData[];
  monthlyTotal: number;
  monthlyCost: number;
  todayTotal: number;
  todayCost: number;
  maxDailyCount: number;
  planType: "free" | "pro" | "custom";
}

const COST_PER_ACTION = 50 / 10000; // $0.005 per execution job

/**
 * Get execution jobs usage for the current calendar month.
 * Returns daily breakdown from 1st of month to today, with future days as placeholders.
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
    // Get user's plan type
    const [userLimits] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.organizationId, orgId));

    const planType = userLimits?.planType || "free";

    // Get current month boundaries (in UTC)
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const lastDayOfMonth = new Date(
      Date.UTC(year, month + 1, 0, 23, 59, 59, 999),
    );
    const today = new Date(
      Date.UTC(year, month, now.getUTCDate(), 23, 59, 59, 999),
    );

    // Query execution jobs grouped by day (using UTC date)
    const results = await db
      .select({
        date: sql<string>`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(executionJobs)
      .where(
        and(
          eq(executionJobs.organizationId, orgId),
          gte(executionJobs.createdAt, firstDayOfMonth),
          lte(executionJobs.createdAt, today),
        ),
      )
      .groupBy(sql`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`)
      .orderBy(sql`DATE(${executionJobs.createdAt} AT TIME ZONE 'UTC')`);

    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    results.forEach((row) => {
      dataMap.set(row.date, Number(row.count));
    });

    // Generate array with all days of the month (in UTC)
    const daysInMonth = lastDayOfMonth.getUTCDate();
    const dailyData: DailyUsageData[] = [];
    let monthlyTotal = 0;
    let todayTotal = 0;
    let maxDailyCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month, day));
      const dateStr = date.toISOString().split("T")[0];
      const count = dataMap.get(dateStr) || 0;
      const cost = planType === "free" ? 0 : count * COST_PER_ACTION;

      dailyData.push({
        date: dateStr,
        count,
        cost,
      });

      // Only count past and current day in totals
      if (date <= today) {
        monthlyTotal += count;
        maxDailyCount = Math.max(maxDailyCount, count);
      }

      // Check if this is today (in UTC)
      if (
        date.getUTCDate() === now.getUTCDate() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCFullYear() === now.getUTCFullYear()
      ) {
        todayTotal = count;
      }
    }

    const monthlyCost =
      planType === "free" ? 0 : monthlyTotal * COST_PER_ACTION;
    const todayCost = planType === "free" ? 0 : todayTotal * COST_PER_ACTION;

    return {
      success: true,
      data: {
        dailyData,
        monthlyTotal,
        monthlyCost,
        todayTotal,
        todayCost,
        maxDailyCount,
        planType,
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
