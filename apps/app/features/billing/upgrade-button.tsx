"use client";

import { Button } from "@/components/ui/button";
import { useUpgrade } from "@/hooks/use-upgrade";

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const { upgrade, isLoading } = useUpgrade();

  return (
    <Button
      variant="black"
      onClick={upgrade}
      isLoading={isLoading}
      className={className}
    >
      Upgrade to Pro
    </Button>
  );
}
