import * as React from "react";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { useField } from "formik";

const root = cva(
  [
    "[--input-py:theme(spacing.[1.5])]",
    "[--input-px:theme(spacing.3)]",
    "[--input-pl:--input-px]",
    "[--input-pr:--input-px]",
    "[--input-border-color-invalid:theme(colors.red.400)]",
    "[--input-background-color:theme(colors.white)]",
    "dark:[--input-background-color:theme(colors.gray.750)]",
    "relative flex self-start items-center rounded flex-row placeholder:text-secondary",
    "bg-[--input-background-color] pr-[--root-pr] shadow shadow-black/[0.08] ring-1 ring-[--input-border-color] transition focus-within:ring-[0.1875rem] focus-within:ring-[--input-ring-color] focus-within:ring-offset-1 focus-within:ring-offset-[--input-border-color-focus]",
  ],
  {
    variants: {
      error: {
        true: [
          "[--input-border-color:--input-border-color-invalid]",
          "[--input-border-color-focus:--input-border-color-invalid]",
          "[--input-ring-color:theme(colors.red.500/0.15)]",
        ],
        false: [
          "[--input-border-color:theme(colors.black/0.1)]",
          "[--input-border-color-focus:theme(colors.black/0.15)]",
          "[--input-ring-color:theme(colors.black/0.08)]",

          "dark:[--input-border-color:theme(colors.white/0.1)]",
          "dark:[--input-border-color-focus:theme(colors.white/0.12)]",
          "dark:[--input-ring-color:theme(colors.white/0.08)]",
        ],
      },
    },
  }
);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <div
        className={cn(
          "w-full",
          root({
            error: false,
          })
          // prepend && "[--root-pr:theme(spacing.[1])]",
          // rootClassName
        )}
      >
        <input
          type={type}
          className={cn(
            "w-full flex-1 appearance-none truncate rounded-inherit bg-transparent px-[--input-px] py-[--input-py] pl-[--input-pl] text-base font-normal text-primary outline-none",
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

const InputForm = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, name, type, ...props }, ref) => {
  const [fieldProps, field, { setValue, setError }] = useField(name!);

  return (
    <Input
      className={className}
      type={type}
      {...fieldProps}
      {...props}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange?.(e);
      }}
      ref={ref}
    />
  );
});
InputForm.displayName = "InputForm";

export { Input, InputForm };
