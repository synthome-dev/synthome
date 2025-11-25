import { PageWrapper } from "@/components/page-wrapper";
import { PageTitle } from "@/components/page-title";
import { getExecutions } from "@/features/logs/actions";
import { LogsTableWrapper } from "@/features/logs/logs-table-wrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logs",
};

interface LogsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "10");

  const result = await getExecutions({ page, limit });

  if (!result.success || !result.data) {
    return (
      <PageWrapper>
        <PageTitle className="mb-6">Logs</PageTitle>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-red-600">
            {result.error || "Failed to load executions"}
          </p>
        </div>
      </PageWrapper>
    );
  }

  const { executions, total } = result.data;

  return (
    <PageWrapper>
      <PageTitle className="mb-6">Logs</PageTitle>
      {executions.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            No executions found. Your execution logs will appear here.
          </p>
        </div>
      ) : (
        <LogsTableWrapper
          initialExecutions={executions}
          total={total}
          initialPage={page}
          initialLimit={limit}
        />
      )}
    </PageWrapper>
  );
}
