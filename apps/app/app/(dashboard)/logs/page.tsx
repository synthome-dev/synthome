import { PageWrapper } from "@/components/page-wrapper";
import { PageTitle } from "@/components/page-title";

export default function LogsPage() {
  return (
    <PageWrapper>
      <PageTitle className="mb-6">Logs</PageTitle>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          Your application logs will appear here.
        </p>
      </div>
    </PageWrapper>
  );
}
