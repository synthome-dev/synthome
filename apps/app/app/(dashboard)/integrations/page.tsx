import { PageWrapper } from "@/components/page-wrapper";
import { IntegrationsContent } from "@/features/integrations";
import { auth } from "@clerk/nextjs/server";
import { providerKeyService, storageIntegrationService } from "@repo/api-keys";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function IntegrationsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <PageWrapper>
        <h1 className="text-[1.5rem] leading-[2rem] tracking-[-0.01em] font-medium text-primary mb-6">
          Integrations
        </h1>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Please select an organization to manage integrations.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const [keys, storageIntegration] = await Promise.all([
    providerKeyService.listProviderKeys(orgId),
    storageIntegrationService.getStorageIntegration(orgId),
  ]);

  return (
    <PageWrapper>
      <IntegrationsContent
        keys={keys}
        storageIntegration={storageIntegration}
      />
    </PageWrapper>
  );
}
