import { PageTitle } from "@/components/page-title";
import { PageWrapper } from "@/components/page-wrapper";
import { getRecentExecutions } from "@/features/logs/actions";
import {
  ExecutionsTable,
  ShowAllExecutionsHeader,
} from "@/features/logs/executions-table";
import { getMonthlyUsageStats } from "@/features/usage/actions";
import { UsageOverview } from "@/features/usage/usage-overview";

export default async function OverviewPage() {
  const result = await getRecentExecutions(10);
  const recentExecutions = result.success ? result.data || [] : [];

  const usageResult = await getMonthlyUsageStats();
  const usageStats = usageResult.success ? usageResult.data : null;

  return (
    <PageWrapper>
      <PageTitle className="mb-6">Overview</PageTitle>

      {usageStats && <UsageOverview stats={usageStats} />}

      <div className="space-y-4">
        {recentExecutions.length === 0 ? (
          <div className="rounded-lg border bg-card p-6">
            <p className="text-muted-foreground">
              No recent executions. Start by creating your first execution.
            </p>
          </div>
        ) : (
          <>
            <ShowAllExecutionsHeader />
            <ExecutionsTable executions={recentExecutions} />
          </>
        )}
      </div>
    </PageWrapper>
  );
}
