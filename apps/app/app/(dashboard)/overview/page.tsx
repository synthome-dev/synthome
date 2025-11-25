import { PageTitle } from "@/components/page-title";
import { PageWrapper } from "@/components/page-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { getRecentExecutions } from "@/features/logs/actions";
import {
  ExecutionsTable,
  ShowAllExecutionsHeader,
} from "@/features/logs/executions-table";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function OverviewPage() {
  const result = await getRecentExecutions(10);
  const recentExecutions = result.success ? result.data || [] : [];

  return (
    <PageWrapper>
      <PageTitle className="mb-6">Overview</PageTitle>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Total Requests</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Active Projects</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">API Calls</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

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
