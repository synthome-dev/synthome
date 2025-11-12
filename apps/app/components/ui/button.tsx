import { TypingLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, cx, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const buttonVariants = cva(
  [
    "group text-balance relative inline-flex select-none items-center justify-center rounded-md bg-[--button-color-bg] font-medium outline-none transition overflow-hidden text-[--button-color-text]",
    "before:bg-[radial-gradient(75%_75%_at_center_top,theme(colors.white/20%),transparent)] before:transition after:transition",
    "ring-[3px] ring-transparent ring-offset-[0.0625rem] ring-offset-[--button-color-border]",
    "focus-visible:ring-[--button-color-ring]",
    "disabled:cursor-not-allowed",
    // disabled:[--button-color-bg:theme(colors.gray.50)] dark:disabled:[--button-color-bg:theme(colors.zinc.800)] !disabled:text-primary disabled:shadow-none disabled:before:hidden disabled:after:hidden disabled:[--button-text-shadow:none]
  ],
  {
    variants: {
      variant: {
        playground: [
          [
            "[--button-color-bg:theme(colors.gray.100)]",
            "[--button-color-text:theme(colors.gray.900)]",
            "hover:[--button-color-bg:theme(colors.gray.200)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.gray.100)]",
          ],
        ],
        "playground-black": [
          [
            "[--button-color-bg:theme(colors.gray.925)] [--button-color-text:theme(colors.white)]",
            "hover:[--button-color-bg:theme(colors.gray.800)]",
            "disabled:[--button-color-bg:theme(colors.gray.800)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.black)]",
          ],
        ],
        "playground-secondary": [
          [
            "[--button-color-bg:theme(colors.gray.100)] [--button-color-text:theme(colors.gray.900)]",
            "hover:[--button-color-bg:theme(colors.gray.200)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.gray.100)]",
          ],
        ],
        primary: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.purple.500)]",
            "[--button-color-icon:theme(colors.white/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.purple.500/0.2)]",
            "[--button-color-text:theme(colors.white)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.purple.700)]",
          ],
          "hover:before:opacity-25 active:[--button-color-bg:theme(colors.purple.600)] relative shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.purple.500),0px_2px_2px_-1px_theme(colors.purple.900/24%),0px_4px_4px_-2px_theme(colors.purple.900/12%)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
        ],
        blue: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.blue.500)]",
            "[--button-color-icon:theme(colors.white/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.blue.500/0.2)]",
            "[--button-color-text:theme(colors.white)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.blue.700)]",
          ],
          "hover:before:opacity-25 active:[--button-color-bg:theme(colors.blue.600)] relative shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.blue.500),0px_2px_2px_-1px_theme(colors.blue.900/24%),0px_4px_4px_-2px_theme(colors.blue.900/12%)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
        ],
        orange: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.orange.500)]",
            "[--button-color-icon:theme(colors.white/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.orange.500/0.2)]",
            "[--button-color-text:theme(colors.white)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.orange.700)]",
          ],
          "hover:before:opacity-25 active:[--button-color-bg:theme(colors.orange.600)] relative shadow-[inset_0px_1px_0px_theme(colors.white/8%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.orange.500),0px_2px_2px_-1px_theme(colors.orange.900/24%),0px_4px_4px_-2px_theme(colors.orange.900/12%)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
        ],
        back: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.gray.900)]",
            "[--button-color-icon:theme(colors.white/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.gray.900)]",
            "[--button-color-text:theme(colors.white)]",
            "[--button-text-shadow:0px_1px_1px_theme(colors.gray.900)]",
          ],
          "hover:before:opacity-25 active:[--button-color-bg:theme(colors.gray.800)] relative shadow-[-10_1px_theme(colors.white/0.07)_inset,0_1px_3px_theme(colors.gray.900/0.2)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
          "ring-[0.375rem] ring-black/7.5",
        ],
        action: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.cyan.400)]",
            "[--button-color-icon:theme(colors.cyan.950/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.cyan.500/0.2)]",
            "[--button-color-text:theme(colors.cyan.950)]",
            "[--button-text-shadow:0px_1px_0px_theme(colors.white/20%)]",
          ],
          "hover:before:opacity-25 relative bg-cyan-400 shadow-[inset_0px_0px_0px_1px_theme(colors.white/6%),inset_0px_1px_0px_theme(colors.white/6%),inset_0px_-1px_0px_theme(colors.white/4%),0px_0px_0px_1px_theme(colors.cyan.400),0px_2px_2px_-1px_theme(colors.cyan.900/24%),0px_4px_4px_-2px_theme(colors.cyan.900/12%)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
        ],
        secondary: [
          [
            "[--button-color-border:theme(colors.black/0.08)]",
            "[--button-color-bg:theme(colors.white)]",
            "[--button-color-icon:theme(textColor.tertiary)]",
            "[--button-color-icon-hover:theme(textColor.primary)]",
            "[--button-color-ring:theme(colors.black/0.08)]",
            "[--button-color-text:theme(textColor.primary)]",
            "hover:[--button-color-bg:theme(colors.gray.50)] ",
            "active:[--button-color-bg:theme(colors.gray.100)]",

            "dark:[--button-color-border:theme(colors.gray.700)]",
            "dark:[--button-color-bg:theme(colors.gray.800)]",
            "dark:[--button-color-icon:theme(textColor.tertiary)]",
            "dark:[--button-color-icon-hover:theme(textColor.primary)]",
            "dark:[--button-color-ring:theme(colors.gray.600)]",
            "dark:[--button-color-text:theme(textColor.primary)]",
            "dark:hover:[--button-color-bg:theme(colors.gray.800)] ",
            "dark:active:[--button-color-bg:theme(colors.gray.800)]",
          ],
          "before:absolute before:inset-0 before:rounded-inherit before:bg-gradient-to-b before:from-black/0 before:from-50% before:to-black/[0.02] before:transition-opacity",
        ],
        ghost: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.transparent)]",
            "[--button-color-icon:theme(textColor.tertiary)]",
            "[--button-color-icon-hover:theme(textColor.secondary)]",
            "[--button-color-ring:theme(colors.black/0.08)]",
            "[--button-color-text:theme(textColor.secondary)]",
            "hover:[--button-color-bg:theme(colors.gray.100)]",
            "hover:[--button-color-text:theme(textColor.primary)]",
            "active:[--button-color-bg:theme(colors.gray.100)]",
            "data-[state=open]:[--button-color-bg:theme(colors.gray.100)]",
            "dark:data-[state=open]:[--button-color-bg:theme(colors.zinc.700)]",
            "dark:hover:[--button-color-bg:theme(colors.zinc.700)]",
            "dark:active:[--button-color-bg:theme(colors.zinc.700)]",
            "dark:[--button-color-text:theme(colors.zinc.200)]",
            "dark:hover:[--button-color-text:theme(colors.zinc.200)]",
          ],
          "focus-visible:[--button-color-border:theme(colors.black/0.15)]",
        ],
        destructive: [
          [
            "[--button-color-border:--button-color-bg]",
            "[--button-color-bg:theme(colors.red.500)]",
            "[--button-color-icon:theme(colors.white/0.8)]",
            "[--button-color-icon-hover:currentColor]",
            "[--button-color-ring:theme(colors.red.500/0.2)]",
            "[--button-color-text:theme(colors.white)]",
            "[--button-text-shadow:0px_1px_3px_theme(colors.black/0.25)]",
          ],
          "relative shadow-[0px_2px_3px_theme(colors.gray.800/0.2),_0px_0px_0px_1px_theme(colors.red.500),_inset_0px_1px_0px_theme(colors.white/0.07)] hover:before:opacity-25 active:[--button-color-bg:theme(colors.red.600)]",
          "before:absolute before:inset-0 before:rounded-inherit before:transition-opacity",
        ],
        link: [],
      },
      size: {
        xxs: "px-2 h-7 text-xs",
        xs: "px-2 py-xs text-xs",
        sm: "px-2 py-1 text-sm h-6",
        default: "px-3 py-1.5 text-base h-8",
        lg: "px-5 py-3 text-base",
        icon: "h-8 w-8",
        "icon-sm": "h-6 w-6",
        "icon-xs": "h-4 w-4",

        playground: "text-lg font-semibold px-4 py-2 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  wrapperClassName?: string;
  loadingClassName?: string;
  tooltip?: string;
  shortcut?: string | string[];
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      wrapperClassName,
      loadingClassName,
      variant,
      size,
      children,
      asChild = false,
      tooltip,
      shortcut,
      isLoading,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <motion.div initial={false} animate={isLoading ? "loading" : "idle"}>
          <motion.span
            className={cn(
              cx(
                "flex w-full items-center justify-center gap-1.5 whitespace-nowrap drop-shadow-[--button-text-shadow] transition-color",
                "[--button-height:calc((theme(spacing.3)+theme(fontSize.base[1].lineHeight))*-1)]",
                // "group-disabled:text-tertiary",
                wrapperClassName
              )
            )}
            variants={{
              idle: { y: 0, opacity: 1 },
              loading: { y: -20, opacity: 0 },
            }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
          <AnimatePresence>
            {isLoading && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TypingLoader size="sm" className={loadingClassName} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Comp>
    );

    if (tooltip || shortcut) {
      return (
        <TooltipProvider skipDelayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent sideOffset={10}>
              <div className="flex items-center gap-2">
                {tooltip && <span>{tooltip}</span>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
