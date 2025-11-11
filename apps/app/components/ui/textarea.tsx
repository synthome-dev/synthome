import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { useField } from "formik";

const root = cva(
  [
    "[--textarea-background-color:theme(colors.white)]",
    "[--textarea-border-color-invalid:theme(colors.red.400)]",
    "dark:[--textarea-background-color:theme(colors.gray.750)]",
    "flex min-h-[80px] p-2 w-full rounded bg-[--textarea-background-color] shadow shadow-black/[0.08] ring-1 ring-[--textarea-border-color] transition focus-within:ring-[0.1875rem] focus-within:ring-[--textarea-ring-color] focus-within:ring-offset-1 focus-within:ring-offset-[--textarea-border-color-focus]",
    "text-base font-normal text-primary outline-none placeholder:text-secondary",
    "disabled:cursor-not-allowed disabled:bg-gray-50",
  ],
  {
    variants: {
      error: {
        true: [
          "[--textarea-border-color:--textarea-border-color-invalid]",
          "[--textarea-border-color-focus:--textarea-border-color-invalid]",
          "[--textarea-ring-color:theme(colors.red.500/0.15)]",
        ],
        false: [
          "[--textarea-border-color:theme(colors.black/0.1)]",
          "[--textarea-border-color-focus:theme(colors.black/0.15)]",
          "[--textarea-ring-color:theme(colors.black/0.08)]",

          "dark:[--textarea-border-color:theme(colors.white/0.12)]",
          "dark:[--textarea-border-color-focus:theme(colors.white/0.12)]",
          "dark:[--textarea-ring-color:theme(colors.white/0.08)]",
        ],
      },
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof root> {
  wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, name, wrapperClassName, ...props }, ref) => {
    // const [fieldProps, field, { setValue, setError }] = useField(name!);

    return (
      <div className={cn(wrapperClassName)}>
        <textarea
          className={cn(
            root({
              error: false,
            }),
            className
          )}
          ref={ref}
          {...props}
          // {...fieldProps}
          onChange={(e) => {
            // setValue(e.target.value);
            props.onChange?.(e);
          }}
        />
        {/* {field.touched && field.error ? (
          <div className="text-sm mt-2 text-red-500">{field.error}</div>
        ) : null} */}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

const TextareaForm = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, name, wrapperClassName, ...props }, ref) => {
    const [fieldProps, field, { setValue, setError }] = useField(name!);

    return (
      <div className={cn(wrapperClassName)}>
        <textarea
          className={cn(
            root({
              error: false,
            }),
            className
          )}
          ref={ref}
          {...props}
          {...fieldProps}
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.(e);
          }}
        />
        {/* {field.touched && field.error ? (
          <div className="text-sm mt-2 text-red-500">{field.error}</div>
        ) : null} */}
      </div>
    );
  }
);
TextareaForm.displayName = "TextareaForm";

export { Textarea, TextareaForm };
