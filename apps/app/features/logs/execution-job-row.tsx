"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";
import { ExecutionJob } from "./types";

interface ExecutionJobRowProps {
  job: ExecutionJob;
  onJobClick: (job: ExecutionJob) => void;
  isHighlighted?: boolean;
}

export function ExecutionJobRow({
  job,
  onJobClick,
  isHighlighted = false,
}: ExecutionJobRowProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgressDisplay = () => {
    if (!job.progress) return "—";
    if (job.progress.percentage !== undefined) {
      return `${job.progress.percentage}%`;
    }
    if (job.progress.stage) {
      return job.progress.stage;
    }
    return "—";
  };

  return (
    <TableRow
      data-state="expanded"
      onClick={() => onJobClick(job)}
      className={cn(
        "cursor-pointer [&]:!bg-surface-100 dark:[&]:!bg-[#1f1f23] [&:hover]:!bg-surface-200 dark:[&:hover]:!bg-[#18181b] transition-colors",
        isHighlighted && "animate-row-highlight",
      )}
    >
      <TableCell className="pl-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-secondary">
            {formatDate(job.createdAt)}
          </span>
          <span className="text-sm text-primary">{job.operation}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={job.status} />
      </TableCell>
      <TableCell className="text-sm text-secondary"></TableCell>
      <TableCell className="font-mono text-xs text-secondary">
        {job.jobId}
      </TableCell>
    </TableRow>
  );
}
