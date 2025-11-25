"use client";

import { useState } from "react";
import { MonthlyUsageStats } from "./actions";
import { formatCurrency, formatNumber } from "./date-utils";
import { UsageMetricCard } from "./usage-metric-card";

interface UsageOverviewProps {
  stats: MonthlyUsageStats;
}

export function UsageOverview({ stats }: UsageOverviewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Only show cost tooltip for non-free users
  const costTooltip =
    stats.planType !== "free"
      ? "Your plan includes 10,000 actions. Additional usage is charged at $5 per 1,000 actions."
      : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <UsageMetricCard
        title="Actions"
        monthlyTotal={stats.monthlyTotal}
        dailyData={stats.dailyData}
        maxValue={stats.maxDailyCount}
        selectedDate={selectedDate}
        onDateHover={setSelectedDate}
        valueFormatter={formatNumber}
        footerFormatter={(value) => `${formatNumber(value)} Execution Jobs`}
        colorScheme="blue"
      />

      <UsageMetricCard
        title="Cost"
        monthlyTotal={stats.monthlyCost}
        dailyData={stats.dailyData.map((d) => ({
          ...d,
          count: d.cost,
        }))}
        maxValue={Math.max(...stats.dailyData.map((d) => d.cost))}
        selectedDate={selectedDate}
        onDateHover={setSelectedDate}
        valueFormatter={formatCurrency}
        footerFormatter={formatCurrency}
        colorScheme="yellow"
        infoTooltip={costTooltip}
      />
    </div>
  );
}
