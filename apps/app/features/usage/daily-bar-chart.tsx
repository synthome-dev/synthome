"use client";

import { DailyUsageData } from "./actions";
import { isFutureDate, isToday } from "./date-utils";

interface DailyBarChartProps {
  data: DailyUsageData[];
  maxValue: number;
  selectedDate: string | null;
  onDateHover: (date: string | null) => void;
  valueFormatter: (value: number) => string;
  colorScheme?: "blue" | "yellow";
}

export function DailyBarChart({
  data,
  maxValue,
  selectedDate,
  onDateHover,
  valueFormatter,
  colorScheme = "blue",
}: DailyBarChartProps) {
  const maxHeight = 48; // pixels

  // Color configuration based on scheme
  const colors = {
    blue: {
      base: "bg-blue-400 dark:bg-blue-400",
      today: "bg-blue-500 dark:bg-blue-500",
      hover: "group-hover:bg-blue-500 dark:group-hover:bg-blue-500",
      selected: "bg-blue-500 dark:bg-blue-500",
    },
    yellow: {
      base: "bg-yellow-400 dark:bg-yellow-400",
      today: "bg-yellow-500 dark:bg-yellow-500",
      hover: "group-hover:bg-yellow-500 dark:group-hover:bg-yellow-500",
      selected: "bg-yellow-500 dark:bg-yellow-500",
    },
  };

  const colorSet = colors[colorScheme];

  return (
    <div className="flex items-end justify-between gap-[2px] h-[60px] px-4">
      {data.map((day) => {
        const isFuture = isFutureDate(day.date);
        const isCurrentDay = isToday(day.date);
        const isSelected = selectedDate === day.date;
        const height =
          maxValue > 0 && day.count > 0
            ? Math.max(4, (day.count / maxValue) * maxHeight)
            : 2; // Show 2px bar even when there's no data

        return (
          <div
            key={day.date}
            className="flex-1 relative group cursor-pointer h-full flex items-end"
            onMouseEnter={() => onDateHover(day.date)}
            onMouseLeave={() => onDateHover(null)}
          >
            {/* Gray background bar - full height, only visible on hover */}
            <div
              className={`
                absolute inset-0 w-full rounded-sm transition-opacity duration-150
                bg-surface-50
                ${isSelected ? "opacity-100" : "opacity-0"}
              `}
            />

            {/* Data bar - proportional height */}
            <div
              className={`
                relative w-full rounded-[2px] transition-all duration-150
                ${
                  isFuture
                    ? "bg-gray-300 dark:bg-gray-500"
                    : isSelected
                      ? colorSet.selected
                      : isCurrentDay
                        ? `${colorSet.today} ${colorSet.hover}`
                        : `${colorSet.base} ${colorSet.hover}`
                }
              `}
              style={{ height: `${height}px` }}
            />

            {/* Tooltip */}
            <div
              className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                px-2 py-1 rounded bg-gray-900 dark:bg-gray-100
                text-white dark:text-gray-900 text-xs whitespace-nowrap
                pointer-events-none transition-opacity duration-150
                ${isSelected ? "opacity-100" : "opacity-0"}
                z-10
              `}
            >
              {valueFormatter(day.count)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
