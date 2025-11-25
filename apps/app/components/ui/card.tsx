'use client'

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import clsx from "clsx";
import * as React from "react";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      {...props}
      className={cn(
        "rounded-md overflow-hidden w-full relative",
        "ring-1 ring-gray-900/5",
        "bg-white shadow-[0_1px_5px_-4px_rgba(19,19,22,0.7),0_4px_8px_rgba(32,42,54,0.05)]",
        "dark:bg-surface-100 dark:shadow-[0_-1px_rgba(255,255,255,0.06),0_4px_8px_rgba(0,0,0,0.05),0_0_0_1px_rgba(255,255,255,0.1),0_1px_6px_-4px_#000]",
        className
      )}
    />
  );
});
Card.displayName = "Card";

const CardScrollingContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  // Check for overflow on mount and when content changes
  React.useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current) {
        const isOverflow =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        const isScrolledToBottom =
          contentRef.current.scrollTop + contentRef.current.clientHeight >=
          contentRef.current.scrollHeight;
        setIsOverflowing(isOverflow && !isScrolledToBottom);
      }
    };

    checkOverflow();

    // Optionally add event listeners for window resize or content mutation
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [contentRef, props.children]);

  return (
    <>
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
          }
        }}
        className={cn("overflow-auto", className)}
        {...props}
      />
      {isOverflowing && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
    </>
  );
});
CardScrollingContent.displayName = "CardScrollingContent";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-0.5 p-4 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-base font-medium text-primary", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px bg-gray-100 dark:bg-gray-900", className)}
    {...props}
  />
));
CardDivider.displayName = "CardDivider";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-secondary", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <React.Fragment>
    {/* <CardDivider /> */}
    <div
      ref={ref}
      className={cn("flex items-center p-4", className)}
      {...props}
    />
  </React.Fragment>
));
CardFooter.displayName = "CardFooter";

export const rootVariants = cva(
  [
    "[--card-p:theme(space.1)]",
    "[--card-item-p:theme(space.1)]",
    "px-[--card-body-px]",
    "isolate",
    "overflow-hidden",
    "rounded-md",
    "relative",
    "pb-0.5",
  ],
  {
    variants: {
      background: {
        "surface-50": "bg-surface-50",
        "surface-100": "bg-surface-100 dark:bg-surface-200",
      },
      spacing: {
        none: "[--card-body-px:0] [--card-body-py:0]",
        compact:
          "[--card-body-px:2px] [--card-body-py:0px]",
        cozy: "[--card-body-px:theme(space.8)] [--card-body-py:theme(space.6)]",
      },
    },
    defaultVariants: {
      background: "surface-100",
      spacing: "compact",
    },
  }
);

export interface RootProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rootVariants> {}

const CardRoot = ({ children, className, spacing, background }: RootProps) => {
  return (
    <section className={cn(rootVariants({ spacing, background }), className)}>
      {children}
    </section>
  );
};

const CardRootHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <header className={cn("p-4 space-y-1", className)}>{children}</header>;
};

const CardRootFooter = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <footer className={cn("py-4 px-4", className)}>{children}</footer>;
};

const CardRootTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex text-lg font-semibold leading-none text-primary",
        className
      )}
    >
      {children}
    </div>
  );
};

const CardRootText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex text-base text-secondary", className)}>
      {children}
    </div>
  );
};

const CeramicCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx([
        "relative block w-full overflow-hidden rounded-lg",
        "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm",
        "dark:before:hidden",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-purple-500",
        "relative",
        className,
      ])}
    >
      {children}
    </div>
  );
};

export {
  Card,
  CardContent,
  CardDescription,
  CardDivider,
  CardFooter,
  CardHeader,
  CardRoot,
  CardRootFooter,
  CardRootHeader,
  CardRootText,
  CardRootTitle,
  CardScrollingContent,
  CardTitle,
  CeramicCard
};

