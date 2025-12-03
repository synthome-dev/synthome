"use client";

import { useCallback, useState } from "react";

interface UseUpgradeOptions {
  onError?: (error: Error) => void;
}

interface UseUpgradeReturn {
  upgrade: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for handling upgrade to Pro plan via Stripe Checkout.
 * Handles loading state, error state, and redirect to Stripe.
 */
export function useUpgrade(options?: UseUpgradeOptions): UseUpgradeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upgrade = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error("Error creating checkout session:", error);
      setError(error);
      options?.onError?.(error);
      setIsLoading(false);
    }
  }, [options]);

  return { upgrade, isLoading, error };
}
