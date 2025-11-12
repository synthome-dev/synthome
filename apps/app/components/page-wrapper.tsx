import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div
      className={cn(
        "[--app-layout-spacing:theme(spacing.10)] mx-auto mt-8 w-[calc(100%-var(--app-layout-spacing))] max-w-6xl pb-12 lg:pb-16",
        className,
      )}
    >
      {children}
    </div>
  );
}
