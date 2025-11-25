import { cn } from "@/lib/utils";
import { ExecutionStatus, JobStatus } from "./types";

interface StatusBadgeProps {
  status: ExecutionStatus | JobStatus | string;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "text-gray-700 dark:text-gray-300",
  },
  in_progress: {
    label: "In Progress",
    className: "text-blue-600 dark:text-blue-300",
  },
  waiting: {
    label: "Waiting",
    className: "text-yellow-600 dark:text-yellow-300",
  },
  completed: {
    label: "Completed",
    className: "text-secondary dark:text-secondary",
  },
  failed: {
    label: "Failed",
    className: "text-red-600 dark:text-red-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-gray-500 dark:text-gray-400",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
