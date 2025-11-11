"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import React, {
  createContext,
  useContext
} from "react";

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

export const editorPanelVariant = cva(
  [
    "[--toolbar-background-color:theme(colors.zinc.100)]",
    "dark:[--toolbar-background-color:theme(colors.white)]",
    "[--toolbar-border-color:theme(colors.black/0.1)]",
    "[--toolbar-border-color-focus:theme(colors.black/0.15)]",
    "[--toolbar-ring-color:theme(colors.black/0.08)]",

    "dark:[--toolbar-border-color:theme(colors.white/0.1)]",
    "dark:[--toolbar-border-color-focus:theme(colors.white/0.12)]",
    "dark:[--toolbar-ring-color:theme(colors.white/0.08)]",
    "shadow-sm shadow-black/[0.08] ring-1 ring-[--toolbar-border-color] transition",
  ],
  {
    variants: {
      variant: {
        chat: "rounded-md",
        menu: "rounded-full",
        input: [
          "focus-within:ring-[0.1875rem] focus-within:ring-[--toolbar-ring-color] focus-within:ring-offset-1 focus-within:ring-offset-[--toolbar-border-color-focus] rounded-md",
        ],
      },
    },
  }
);

interface PromptInputProps {
  className?: string;
  children: React.ReactNode;
  value: string;
  onSubmit?: () => void;
}

export function PromptInput({
  className,
  children,
  value,
  onSubmit,
}: PromptInputProps) {
  return (
    <div
      className={cn(
        editorPanelVariant({ variant: "input" }),
        "p-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export type PromptInputTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: number | string;
  onSubmit?: () => void;
};

export function PromptInputTextarea({
  value,
  onChange,
  onKeyDown,
  className,
  placeholder,
  disabled,
  maxHeight = 240,
  onSubmit,
  ...props
}: PromptInputTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  }, [onKeyDown, disabled, onSubmit]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      className={cn(
        "text-primary min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0",
        className
      )}
      rows={1}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
}

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

interface PromptInputActionProps {
  children: React.ReactNode;
  className?: string;
}

export function PromptInputAction({
  children,
  className,
}: PromptInputActionProps) {
  return children;
}

