"use client";

import { Button } from "@/components/ui/button";
import { formatFullDate } from "@/features/usage/date-utils";
import { useUpgrade } from "@/hooks/use-upgrade";
import { useCallback, useEffect, useState } from "react";

interface BillingInfo {
  planType: "free" | "pro" | "custom";
  periodStart: string;
  periodEnd: string;
  includedActions: number;
  actionsUsed: number;
  overageActions: number;
  overageCost: number;
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const {
    upgrade,
    isLoading: isUpgradeLoading,
    error: upgradeError,
  } = useUpgrade();

  useEffect(() => {
    async function fetchBillingInfo() {
      try {
        const response = await fetch("/api/stripe/usage");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch billing info");
        }

        if (data.success) {
          setBilling(data);
        }
      } catch (error) {
        console.error("Error fetching billing info:", error);
        setFetchError(
          error instanceof Error
            ? error.message
            : "Failed to load billing info",
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchBillingInfo();
  }, []);

  const handleManageBilling = useCallback(async () => {
    setIsPortalLoading(true);
    setPortalError(null);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      setPortalError(
        error instanceof Error
          ? error.message
          : "Failed to open billing portal",
      );
      setIsPortalLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (fetchError || !billing) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {fetchError || "Unable to load billing information."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const isPro = billing.planType === "pro";
  const remaining = Math.max(0, billing.includedActions - billing.actionsUsed);

  // Get current error to display
  const currentError = upgradeError?.message || portalError;

  return (
    <div className="p-6 space-y-6">
      {/* Error Banner */}
      {currentError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {currentError}
        </div>
      )}

      {/* Plan Info */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Current Plan
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900 capitalize">
            {billing.planType}
          </span>
          {isPro && <span className="text-sm text-gray-500">$50/month</span>}
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Usage</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">
              {billing.actionsUsed.toLocaleString()}
            </span>
            {" of "}
            <span className="font-medium">
              {billing.includedActions.toLocaleString()}
            </span>
            {" actions used"}
          </p>
          <p>
            <span className="font-medium">{remaining.toLocaleString()}</span>
            {" actions remaining"}
          </p>
          {billing.overageActions > 0 && (
            <p className="text-amber-600">
              <span className="font-medium">
                {billing.overageActions.toLocaleString()}
              </span>
              {" overage actions ("}
              <span className="font-medium">
                ${billing.overageCost.toFixed(2)}
              </span>
              {")"}
            </p>
          )}
        </div>
      </div>

      {/* Billing Period */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Billing Period
        </h3>
        <p className="text-sm text-gray-600">
          {formatFullDate(billing.periodStart)} -{" "}
          {formatFullDate(billing.periodEnd)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Usage resets on {formatFullDate(billing.periodEnd)}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2">
        {isPro ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManageBilling}
            isLoading={isPortalLoading}
          >
            Manage Billing
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={upgrade}
            isLoading={isUpgradeLoading}
          >
            Upgrade to Pro
          </Button>
        )}
      </div>
    </div>
  );
}
