"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "[--checkbox-border-color:theme(colors.black/0.1)] dark:[--checkbox-border-color:theme(colors.white/0.12)]",
      "data-[state=checked]:[--checkbox-bg:theme(colors.purple.500)] data-[state=checked]:[--checkbox-border-color:theme(colors.purple.500)] data-[state=unchecked]:hover:[--checkbox-bg:theme(colors.gray.50)] data-[state=unchecked]:active:[--checkbox-bg:theme(colors.gray.100)] dark:data-[state=unchecked]:hover:[--checkbox-bg:theme(colors.gray.900)] dark:data-[state=unchecked]:active:[--checkbox-bg:theme(colors.gray.850)]",
      "[--checkbox-text-shadow:0px_1px_1px_theme(colors.purple.700)]",
      "dark peer relative h-4.5 w-4.5 shrink-0 rounded-sm text-white bg-[--checkbox-bg] ring-1 ring-[--checkbox-border-color] shadow shadow-black/[0.08] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5 drop-shadow-[--checkbox-text-shadow]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
