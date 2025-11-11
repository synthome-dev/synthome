"use client";

import { useControllableState } from "@/hooks/use-controllable-state";
import { cn } from "@/lib/utils";
import * as RadixSwitch from "@radix-ui/react-switch";
import { VariantProps, cva } from "class-variance-authority";
import { motion, useAnimate } from "framer-motion";
import { forwardRef, useEffect, useReducer } from "react";

const SWITCH_THUMB_SELECTOR = "[data-switch-thumb]";
const SWITCH_THUMB_ANIMATION_DURATION = 0.075;
const SWITCH_THUMB_ANIMATION_DELAY = 0.05;
const SWITCH_ANIMATION_DURATION =
  SWITCH_THUMB_ANIMATION_DURATION + SWITCH_THUMB_ANIMATION_DELAY;

function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

const root = cva(
  [
    "[--switch-background-color:theme(colors.gray.200)] dark:[--switch-background-color:theme(colors.gray.600)]",
    "[--switch-border-color:theme(colors.gray.200)] dark:[--switch-border-color:theme(colors.gray.600)] focus-visible:[--switch-border-color:theme(colors.gray.400)] dark:focus-visible:[--switch-border-color:theme(colors.gray.700)]",
    "[--switch-thumb-border-color:theme(colors.gray.200)] focus-visible:[--switch-thumb-border-color:theme(colors.gray.950)] dark:[--switch-thumb-border-color:theme(colors.gray.600)]",
    "relative isolate flex h-5 w-9.5 min-w-0 flex-shrink-0 appearance-none rounded-full p-px outline-none",
    "ring-2 ring-transparent focus-visible:ring-gray-300 dark:focus-visible:ring-gray-500",
    "before:absolute before:inset-0 before:rounded-full before:border before:border-[--switch-border-color] before:bg-[--switch-background-color]",
    "motion-safe:before:transition-opacity motion-safe:before:duration-[--switch-animation-duration] ",
    "after:absolute after:inset-0 after:rounded-full after:border after:border-[--switch-border-color-active] after:bg-[--switch-background-color-active]",
    "motion-safe:after:transition-opacity motion-safe:after:duration-[--switch-animation-duration]",
  ],
  {
    variants: {
      disabled: {
        true: "cursor-not-allowed opacity-50 pointer-events-none",
        false: null,
      },
      variant: {
        primary: [
          "[--switch-background-color-active:theme(colors.blue.500)]",
          "[--switch-border-color-active:theme(colors.blue.600)]",
          "[--switch-thumb-gradient-to:theme(colors.gray.500)]",
          "[--switch-thumb-border-color-active:theme(colors.blue.500)]",
        ],
        secondary: [
          "[--switch-background-color-active:theme(colors.gray.950)]",
          "[--switch-border-color-active:theme(colors.gray.600)]",
        ],
      },
      checked: {
        false: "justify-start after:opacity-0",
        true: "justify-end after:opacity-100",
      },
    },
  }
);

type SwitchRef = HTMLButtonElement;

export const Switch = forwardRef(function (
  {
    defaultChecked = false,
    checked: checkedProp,
    onCheckedChange: onCheckedChangeProp,
    disabled = false,
    ...props
  }: Omit<RadixSwitch.SwitchProps, "asChild" | "className" | "style"> &
    VariantProps<typeof root>,
  ref: React.ForwardedRef<SwitchRef>
) {
  let [externalChecked, externalOnCheckedChange] = useControllableState({
    value: checkedProp,
    defaultValue: defaultChecked,
    onChange: onCheckedChangeProp,
  });
  let [checked, toggleChecked] = useReducer(
    (c) => !c,
    externalChecked || false
  );

  let [scope, animate] = useAnimate();

  useEffect(() => {
    if (externalChecked === checked) return;

    const handleTransition = async () => {
      await animate(
        SWITCH_THUMB_SELECTOR,
        { width: "100%" },
        {
          duration: SWITCH_THUMB_ANIMATION_DURATION,
          ease: "easeIn",
        }
      );
      toggleChecked();
      await animate(
        SWITCH_THUMB_SELECTOR,
        { width: "auto" },
        {
          delay: SWITCH_THUMB_ANIMATION_DELAY,
          type: "spring",
          mass: 0.25,
          stiffness: 200,
          damping: 12,
        }
      );
    };

    void handleTransition();
  }, [externalChecked, checked]);

  return (
    <RadixSwitch.Root
      ref={mergeRefs([ref, scope])}
      asChild
      className={root({
        variant: "primary",
        checked,
        disabled,
      })}
      checked={externalChecked}
      onCheckedChange={externalOnCheckedChange}
      disabled={disabled}
      style={{
        ["--switch-animation-duration" as string]: `${SWITCH_ANIMATION_DURATION}s`,
        ["--switch-thumb-animation-duration" as string]: `${SWITCH_THUMB_ANIMATION_DURATION}s`,
        ["--switch-thumb-animation-delay" as string]: `${SWITCH_THUMB_ANIMATION_DELAY}s`,
      }}
      {...props}
    >
      <motion.button initial={false} layout layoutRoot>
        <RadixSwitch.Thumb
          asChild
          className={cn(
            "relative z-10 aspect-square h-full rounded-full bg-white dark:bg-gray-100",
            "will-change-transform",

            // unchecked
            "before:absolute before:inset-0 before:rounded-full",
            "before:opacity-10 dark:before:opacity-30",
            "before:bg-gradient-to-b before:from-transparent before:from-10%",
            "before:ring-1",
            "before:ring-[--switch-thumb-border-color]",
            "before:to-black/50",

            // checked
            "after:absolute after:inset-0 after:z-10 after:rounded-full",
            "after:bg-gradient-to-b after:from-transparent after:from-10%",
            "after:ring-1",
            "after:ring-[--switch-thumb-border-color-active]",
            "after:to-[--switch-thumb-gradient-to]",
            "motion-safe:after:transition-opacity",
            "motion-safe:after:duration-[--switch-thumb-animation-duration]",
            "motion-safe:after:delay-[--switch-thumb-animation-delay]",
            checked
              ? "after:opacity-10 dark:after:opacity-30"
              : "after:opacity-0"
          )}
        >
          <motion.span ref={scope} layout data-switch-thumb />
        </RadixSwitch.Thumb>
      </motion.button>
    </RadixSwitch.Root>
  );
});
