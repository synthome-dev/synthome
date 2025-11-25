"use client";

import {
  Card,
  CardFooter,
  CardHeader,
  CardRoot,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { DailyUsageData } from "./actions";
import { DailyBarChart } from "./daily-bar-chart";
import { formatDateLabel, isToday } from "./date-utils";

interface UsageMetricCardProps {
  title: string;
  monthlyTotal: number;
  dailyData: DailyUsageData[];
  maxValue: number;
  selectedDate: string | null;
  onDateHover: (date: string | null) => void;
  valueFormatter: (value: number) => string;
  footerFormatter: (value: number) => string;
  colorScheme?: "blue" | "yellow";
  infoTooltip?: string;
}

export function UsageMetricCard({
  title,
  monthlyTotal,
  dailyData,
  maxValue,
  selectedDate,
  onDateHover,
  valueFormatter,
  footerFormatter,
  colorScheme = "blue",
  infoTooltip,
}: UsageMetricCardProps) {
  // Find the value for the selected date or today
  const displayDate =
    selectedDate ||
    dailyData.find((d) => isToday(d.date))?.date ||
    dailyData[0]?.date;
  const displayData = dailyData.find((d) => d.date === displayDate);
  const displayValue = displayData?.count || 0;

  return (
    <CardRoot className="pt-0.5">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium text-secondary">
                {title}
              </CardTitle>
              <div className="text-3xl font-semibold mt-2 text-primary">
                {valueFormatter(monthlyTotal)}
              </div>
            </div>

            {infoTooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-secondary hover:text-primary">
                    <Info className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-xs">
                    <p>{infoTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>

        <DailyBarChart
          data={dailyData}
          maxValue={maxValue}
          selectedDate={selectedDate}
          onDateHover={onDateHover}
          valueFormatter={valueFormatter}
          colorScheme={colorScheme}
        />

        <CardFooter className="text-sm text-secondary">
          {formatDateLabel(displayDate)}: {footerFormatter(displayValue)}
        </CardFooter>
      </Card>
    </CardRoot>
  );
}
