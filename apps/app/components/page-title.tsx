import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface PageTitleProps {
  children: React.ReactNode;
  level?: HeadingLevel;
  className?: string;
}

const headingStyleMap: Record<HeadingLevel, string> = {
  h1: "text-[1.5rem] leading-[2rem] tracking-[-0.01em] font-medium", // Base (was h4)
  h2: "text-[1.375rem] leading-[1.875rem] tracking-[-0.0075em] font-medium",
  h3: "text-[1.25rem] leading-[1.75rem] tracking-[-0.0075em] font-medium",
  h4: "text-[1.125rem] leading-[1.625rem] tracking-[-0.005em] font-medium",
  h5: "text-[1rem] leading-[1.5rem] tracking-[-0.005em] font-medium",
  h6: "text-[0.9375rem] leading-[1.375rem] tracking-[-0.0025em] font-medium",
};

export function PageTitle({
  children,
  level = "h1",
  className,
}: PageTitleProps) {
  const Component = level;
  const styles = headingStyleMap[level];

  return (
    <Component className={cn(styles, "text-primary", className)}>
      {children}
    </Component>
  );
}
