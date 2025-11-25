"use client";

import { ExecutionsTable } from "@/features/logs/executions-table";
import { Execution } from "@/features/logs/types";
import { useRouter, useSearchParams } from "next/navigation";

interface LogsTableWrapperProps {
  initialExecutions: Execution[];
  total: number;
  initialPage: number;
  initialLimit: number;
}

export function LogsTableWrapper({
  initialExecutions,
  total,
  initialPage,
  initialLimit,
}: LogsTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = initialPage;
  const perPage = initialLimit.toString();

  const handlePerPageChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", value);
    params.set("page", "1"); // Reset to first page
    router.push(`/logs?${params.toString()}`);
  };

  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", (currentPage + 1).toString());
    router.push(`/logs?${params.toString()}`);
  };

  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", (currentPage - 1).toString());
    router.push(`/logs?${params.toString()}`);
  };

  const hasNextPage = currentPage * initialLimit < total;
  const hasPreviousPage = currentPage > 1;

  return (
    <ExecutionsTable
      executions={initialExecutions}
      showPagination={true}
      paginationProps={{
        perPage,
        total,
        currentPage,
        onValueChange: handlePerPageChange,
        hasNextPage,
        onNextPage: handleNextPage,
        hasPreviousPage,
        onPreviousPage: handlePreviousPage,
      }}
    />
  );
}
