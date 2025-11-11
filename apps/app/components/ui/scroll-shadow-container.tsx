import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ScrollShadowContainerProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export function ScrollShadowContainer({
  children,
  className,
  maxHeight = "200px",
}: ScrollShadowContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Show top shadow if not at the very top
    setShowTopShadow(scrollTop > 0);

    // Show bottom shadow if not at the very bottom
    setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    // Check initial state
    checkScrollPosition();

    // Add scroll listener
    scrollElement.addEventListener("scroll", checkScrollPosition);

    // Add resize observer to handle content changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });

    resizeObserver.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Top Shadow */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10 transition-opacity duration-200",
          showTopShadow ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className={cn("overflow-y-auto p-3")}
        style={{ maxHeight }}
      >
        {children}
      </div>

      {/* Bottom Shadow */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10 transition-opacity duration-200",
          showBottomShadow ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
