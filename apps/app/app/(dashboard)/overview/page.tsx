import { PageWrapper } from "@/components/page-wrapper";
import { PageTitle } from "@/components/page-title";

export default function OverviewPage() {
  return (
    <PageWrapper>
      <PageTitle className="mb-6">Overview</PageTitle>
      <div className="grid gap-4 md:grid-cols-3">
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
    </PageWrapper>
  );
}
