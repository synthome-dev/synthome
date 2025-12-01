"use client";

import { IntegrationsTable } from "./integrations-table";
import { StorageIntegrationCard } from "./storage-integration-card";

interface ProviderKey {
  id: string;
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  keyPrefix: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StorageIntegrationInfo {
  id: string;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  cdnUrl: string | null;
  hasCredentials: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function IntegrationsContent({
  keys,
  storageIntegration,
}: {
  keys: ProviderKey[];
  storageIntegration: StorageIntegrationInfo | null;
}) {
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

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-medium text-primary mb-4">
            AI Providers
          </h2>
          <IntegrationsTable keys={keys} />
        </section>

        <section>
          <h2 className="text-lg font-medium text-primary mb-4">Storage</h2>
          <StorageIntegrationCard storageIntegration={storageIntegration} />
        </section>
      </div>
    </>
  );
}
