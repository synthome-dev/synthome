"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "[--radio-border-color:theme(colors.black/0.1)] dark:[--radio-border-color:theme(colors.white/0.12)]",
        "data-[state=checked]:[--radio-bg:theme(colors.purple.500)] data-[state=checked]:[--radio-border-color:theme(colors.purple.500)] data-[state=unchecked]:hover:[--radio-bg:theme(colors.gray.50)] data-[state=unchecked]:active:[--radio-bg:theme(colors.gray.100)] dark:data-[state=unchecked]:hover:[--radio-bg:theme(colors.gray.900)] dark:data-[state=unchecked]:active:[--radio-bg:theme(colors.gray.850)]",
        "[--radio-indicator-shadow:0px_1px_1px_theme(colors.purple.700)]",
        "relative h-4.5 w-4.5 shrink-0 rounded-full text-white bg-[--radio-bg] ring-1 ring-[--radio-border-color] shadow shadow-black/[0.08] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current drop-shadow-[--radio-indicator-shadow]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
