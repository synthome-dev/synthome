"use client";

import { Trash } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VariantProps } from "class-variance-authority";
import { useState } from "react";

export const DeleteButtonWithTooltip = ({
  onConfirm,
  disabled,
  withIcon = true,
  label = "Delete",
  confirmLabel = "Confirm",
  ...props
}: {
  onConfirm: () => void;
  disabled?: boolean;
  withIcon?: boolean;
  label?: string;
  confirmLabel?: string;
} & VariantProps<typeof buttonVariants>) => {
  const [state, setState] = useState<"initial" | "confirm">("initial");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={disabled}
          type="button"
          size={state === "initial" ? props.size : "sm"}
          onClick={(e) => {
            e.stopPropagation();
            if (state === "confirm") {
              onConfirm();
              return;
            }

            setTimeout(() => {
              setState("initial");
            }, 2000);

            setState("confirm");
          }}
          variant={
            state === "initial"
              ? withIcon
                ? "ghost"
                : "secondary"
              : "destructive"
          }
        >
          {state === "initial" ? (
            withIcon ? (
              <Trash className="w-4" />
            ) : (
              label
            )
          ) : (
            confirmLabel
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
};

export const DeleteButton = ({
  onConfirm,
  disabled,
  withIcon = true,
  label = "Delete",
  confirmLabel = "Confirm",
  ...props
}: {
  onConfirm: () => void;
  disabled?: boolean;
  withIcon?: boolean;
  label?: string;
  confirmLabel?: string;
} & VariantProps<typeof buttonVariants>) => {
  const [state, setState] = useState<"initial" | "confirm">("initial");
  const confirmSize = props.size === "icon" ? "default" : "sm";

  return (
    <Button
      disabled={disabled}
      type="button"
      size={state === "initial" ? props.size : confirmSize}
      onClick={(e) => {
        e.stopPropagation();
        if (state === "confirm") {
          onConfirm();
          return;
        }

        setTimeout(() => {
          setState("initial");
        }, 2000);

        setState("confirm");
      }}
      variant={state === "initial" ? props.variant : "destructive"}
    >
      {state === "initial" ? (
        withIcon ? (
          <Trash className="w-4" />
        ) : (
          label
        )
      ) : (
        confirmLabel
      )}
    </Button>
  );
};
