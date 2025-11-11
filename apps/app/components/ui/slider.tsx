"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute before:bg-[radial-gradient(75%_75%_at_center_top,theme(colors.white/20%),transparent)] h-full bg-purple-500 shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.purple.500),0px_2px_2px_-1px_theme(colors.purple.900/24%),0px_4px_4px_-2px_theme(colors.purple.900/12%)] before:absolute before:inset-0 before:rounded-inherit before:transition-opacity" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block cursor-pointer h-6 w-3 rounded-sm dark:shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.gray.600),0px_2px_2px_-1px_theme(colors.zinc.900/24%),0px_4px_4px_-2px_theme(colors.zinc.900/12%)] shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.zinc.300),0px_2px_2px_-1px_theme(colors.zinc.900/24%),0px_4px_4px_-2px_theme(colors.zinc.900/12%)] bg-surface-100 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 before:bg-[radial-gradient(75%_75%_at_center_top,theme(colors.white/0%),transparent)] before:transition after:transition before:absolute before:inset-0 before:rounded-inherit before:from-black/0 before:from-50% before:to-black/[0.02]" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
