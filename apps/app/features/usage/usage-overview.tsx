"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MonthlyUsageStats } from "./actions";
import { formatCurrency, formatNumber, formatShortDate } from "./date-utils";
import { Notification } from "./notification";
import { UsageMetricCard } from "./usage-metric-card";

interface UsageOverviewProps {
  stats: MonthlyUsageStats;
}

export function UsageOverview({ stats }: UsageOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { billingPeriod } = stats;
  const resetDate = formatShortDate(billingPeriod.periodEnd);

  // Check for upgrade success from URL param (e.g., /overview?upgraded=true)
  const upgradedParam = searchParams.get("upgraded") === "true";

  // Use state to persist banner visibility after URL cleanup
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(upgradedParam);

  // Clean up URL after detecting upgrade success
  useEffect(() => {
    if (upgradedParam) {
      setShowUpgradeSuccess(true);
      // Remove the upgraded param from URL without triggering a navigation
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("upgraded");
      newParams.delete("session_id");
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [upgradedParam, pathname, router, searchParams]);

  // Check if free user is over their limit
  const isFreePlanOverLimit =
    stats.planType === "free" &&
    stats.monthlyTotal >= billingPeriod.includedActions;

  // Build tooltip based on plan type
  let actionsTooltip: string;
  let costTooltip: string | undefined;

  if (stats.planType === "free") {
    actionsTooltip = `Free plan includes ${formatNumber(billingPeriod.includedActions)} actions. Resets on ${resetDate}.`;
    costTooltip = undefined;
  } else if (stats.planType === "pro") {
    const remaining = Math.max(
      0,
      billingPeriod.includedActions - stats.monthlyTotal,
    );
    actionsTooltip = `${formatNumber(remaining)} of ${formatNumber(billingPeriod.includedActions)} actions remaining. Resets on ${resetDate}.`;

    if (billingPeriod.isOverage) {
      costTooltip = `${formatNumber(billingPeriod.overageActions)} overage actions at $5 per 1,000. Billed on ${resetDate}.`;
    } else {
      costTooltip = `Your plan includes ${formatNumber(billingPeriod.includedActions)} actions. Overage is $5 per 1,000 actions.`;
    }
  } else {
    // custom plan
    actionsTooltip = `Resets on ${resetDate}.`;
    costTooltip = undefined;
  }

  return (
    <>
      {/* Success banner for upgrade */}
      {showUpgradeSuccess && (
        <Notification
          variant="success"
          message="You've successfully upgraded to Pro!"
        />
      )}

      {/* Warning banner for free plan limit */}
      {isFreePlanOverLimit && !showUpgradeSuccess && (
        <Notification
          variant="info"
          message={`You've used all ${formatNumber(billingPeriod.includedActions)} actions on the Free plan. Your usage resets on ${resetDate}. Upgrade to Pro for 10,000 actions per month.`}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <UsageMetricCard
          title="Actions"
          monthlyTotal={stats.monthlyTotal}
          dailyData={stats.dailyData}
          maxValue={stats.maxDailyCount}
          selectedDate={selectedDate}
          onDateHover={setSelectedDate}
          valueFormatter={formatNumber}
          footerFormatter={(value) => `${formatNumber(value)} actions`}
          colorScheme="blue"
          infoTooltip={actionsTooltip}
        />

        <UsageMetricCard
          title="Cost"
          monthlyTotal={stats.monthlyCost}
          dailyData={stats.dailyData.map((d) => ({
            ...d,
            count: d.cost,
          }))}
          maxValue={Math.max(0, ...stats.dailyData.map((d) => d.cost))}
          selectedDate={selectedDate}
          onDateHover={setSelectedDate}
          valueFormatter={formatCurrency}
          footerFormatter={formatCurrency}
          colorScheme="yellow"
          infoTooltip={costTooltip}
        />
      </div>
    </>
  );
}
