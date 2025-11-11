"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { useState } from "react";

export const CancelButton = ({
  onConfirm,
  disabled,
  label = "Cancel",
  confirmLabel = "Confirm?",
  ...props
}: {
  onConfirm: () => void;
  disabled?: boolean;
  label?: string;
  confirmLabel?: string;
} & VariantProps<typeof buttonVariants>) => {
  const [state, setState] = useState<"initial" | "confirm">("initial");

  return (
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
      variant={state === "initial" ? "secondary" : "destructive"}
    >
      {state === "initial" ? label : confirmLabel}
    </Button>
  );
};
