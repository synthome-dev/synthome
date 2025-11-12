import { PageWrapper } from "@/components/page-wrapper";
import { ApiKeysContent } from "@/features/api-keys";
import { auth } from "@clerk/nextjs/server";
import { apiKeyService } from "@repo/api-keys";

export default async function ApiKeysPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <PageWrapper>
        <h1 className="text-[1.5rem] leading-[2rem] tracking-[-0.01em] font-medium text-primary mb-6">
          API Keys
        </h1>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Please select an organization to view API keys.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const keys = await apiKeyService.listApiKeysWithDecryption(orgId);

  return (
    <PageWrapper>
      <ApiKeysContent keys={keys} />
    </PageWrapper>
  );
}
