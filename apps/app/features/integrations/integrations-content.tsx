"use client";

import { IntegrationsTable } from "./integrations-table";

interface ProviderKey {
  id: string;
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  keyPrefix: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function IntegrationsContent({ keys }: { keys: ProviderKey[] }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-[1.5rem] leading-[2rem] tracking-[-0.01em] font-medium text-primary mb-2">
          Integrations
        </h1>
        <p className="text-[14px] text-secondary">
          Connect your AI provider accounts to use them automatically in all
          executions. Keys provided in SDK requests will override stored keys.
        </p>
      </div>

      <IntegrationsTable keys={keys} />
    </>
  );
}
