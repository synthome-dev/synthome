"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVideoLoadingState } from "@/hooks/use-video";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { ArrowUp } from "lucide-react";
import React, { memo } from "react";

export const editorPanelVariant = cva(
  [
    "[--toolbar-background-color:theme(colors.gray.100)]",
    "dark:[--toolbar-background-color:theme(colors.white)]",
    "[--toolbar-border-color:theme(colors.black/0.1)]",
    "[--toolbar-border-color-focus:theme(colors.black/0.15)]",
    "[--toolbar-ring-color:theme(colors.black/0.08)]",

    "dark:[--toolbar-border-color:theme(colors.gray.700)]",
    "dark:[--toolbar-border-color-focus:theme(colors.gray.600)]",
    "dark:[--toolbar-ring-color:theme(colors.white/0.08)]",
    "shadow-sm shadow-black/[0.08] ring-1 ring-[--toolbar-border-color] transition",
  ],
  {
    variants: {
      variant: {
        chat: "rounded-md",
        menu: "rounded-full",
        input: [
          "ring-0 rounded-2xl shadow-[0_1px_5px_-4px_rgba(19,19,22,0.7),0_4px_8px_rgba(32,42,54,0.05)] bg-gray-100 dark:bg-gray-800",
        ],
      },
    },
  }
);

const SubmitButton = memo(({ disabled }: { disabled?: boolean }) => {
  const { isLoading } = useVideoLoadingState();
  return (
    <PromptInputAction>
      <Button
        disabled={isLoading || disabled}
        variant="playground-black"
        size="icon"
        className="h-8 w-8 rounded-full"
        type="submit"
      >
        <ArrowUp className="size-5" />
      </Button>
    </PromptInputAction>
  );
});

SubmitButton.displayName = "SubmitButton";

interface PromptInputProps {
  className?: string;
  children: React.ReactNode;
  value: string;
  onSubmit?: () => void;
}

export const PromptInput = memo(
  ({ className, children, value, onSubmit }: PromptInputProps) => {
    const handleSubmit = React.useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.();
      },
      [onSubmit]
    );

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          editorPanelVariant({ variant: "input" }),
          "p-2",
          className
        )}
      >
        {children}
      </form>
    );
  }
);

PromptInput.displayName = "PromptInput";

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

export const PromptInputTextarea = memo(
  ({
    value,
    onChange,
    onKeyDown,
    className,
    placeholder,
    disabled,
    maxHeight = 240,
    onSubmit,
    ...props
  }: PromptInputTextareaProps) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      if (!textareaRef.current) return;

      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        typeof maxHeight === "number"
          ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
          : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
    }, [value, maxHeight]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !disabled) {
          e.preventDefault();
          onSubmit?.();
        }
        onKeyDown?.(e);
      },
      [onKeyDown, disabled, onSubmit]
    );

    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        wrapperClassName="w-full"
        className={cn(
          "text-primary text-xl min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ring-0",
          className
        )}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

PromptInputTextarea.displayName = "PromptInputTextarea";

interface PromptInputActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  showFileUpload?: boolean;
  rightChildren?: React.ReactNode;
  disabled?: boolean;
}

export const PromptInputActions = memo(
  ({
    children,
    rightChildren,
    className,
    showFileUpload,
    disabled,
    ...props
  }: PromptInputActionsProps) => {
    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        {children}
        <div className="flex items-center gap-2">
          {rightChildren}
          <SubmitButton disabled={disabled} />
        </div>
      </div>
    );
  }
);

PromptInputActions.displayName = "PromptInputActions";

interface PromptInputActionProps {
  children: React.ReactNode;
  className?: string;
}

export const PromptInputAction = memo(
  ({ children, className }: PromptInputActionProps) => {
    return children;
  }
);

PromptInputAction.displayName = "PromptInputAction";
