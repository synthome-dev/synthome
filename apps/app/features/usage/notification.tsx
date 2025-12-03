"use client";

import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle, Info } from "lucide-react";

const notificationVariants = cva(
  "relative flex items-center gap-4 rounded-xl ring-1 ring-inset p-4 mb-6",
  {
    variants: {
      variant: {
        info: "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 ring-blue-200 dark:ring-blue-800",
        success:
          "bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-200 ring-green-200 dark:ring-green-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const iconVariants = cva("h-5 w-5", {
  variants: {
    variant: {
      info: "text-blue-600 dark:text-blue-400",
      success: "text-green-600 dark:text-green-400",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const iconMap = {
  info: Info,
  success: CheckCircle,
} as const;

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  isActionLoading?: boolean;
}

export function Notification({
  message,
  variant = "info",
  actionLabel,
  onAction,
  isActionLoading,
}: NotificationProps) {
  const IconComponent = iconMap[variant ?? "info"];

  return (
    <div className={notificationVariants({ variant })}>
      {/* Icon */}
      <div className="flex-shrink-0">
        <IconComponent className={iconVariants({ variant })} />
      </div>

      {/* Message */}
      <div className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <p className="text-sm">{message}</p>

        {/* Action Button */}
        {actionLabel && onAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            isLoading={isActionLoading}
            className="flex-shrink-0"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
