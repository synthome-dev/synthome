"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardRoot } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadRow,
  TableNavigation,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { ExecutionJobRow } from "./execution-job-row";
import { ExecutionJobSheet } from "./execution-job-sheet";
import { StatusBadge } from "./status-badge";
import { Execution, ExecutionJob } from "./types";
import { ChangedIds } from "./utils/diff-executions";

interface ExecutionsTableProps {
  executions: Execution[];
  highlightedIds?: ChangedIds;
  showPagination?: boolean;
  paginationProps?: {
    perPage: string;
    total: number;
    currentPage: number;
    onValueChange: (value: string) => void;
    hasNextPage: boolean;
    nextPageUrl?: string;
    onNextPage?: () => void;
    hasPreviousPage: boolean;
    onPreviousPage?: () => void;
    previousPageUrl?: string;
  };
}

export const ShowAllExecutionsHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Recent Executions</h2>

      <Link
        className={cn(
          buttonVariants({
            variant: "secondary",
            size: "sm",
          })
        )}
        href="/logs"
      >
        View All
      </Link>
    </div>
  );
};

export function ExecutionsTable({
  executions,
  highlightedIds,
  showPagination = false,
  paginationProps,
}: ExecutionsTableProps) {
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(
    null
  );
  const [selectedJob, setSelectedJob] = useState<ExecutionJob | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
  };

  const toggleExpand = (executionId: string) => {
    setExpandedExecutionId(
      expandedExecutionId === executionId ? null : executionId
    );
  };

  const handleJobClick = (job: ExecutionJob) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  // Get all jobs for the currently selected job (for dependency resolution)
  const getAllJobsForSelectedJob = (): ExecutionJob[] => {
    if (!selectedJob) return [];
    const execution = executions.find((e) => e.id === selectedJob.executionId);
    return execution?.jobs || [];
  };

  return (
    <>
      <CardRoot>
        <table className="w-full table-fixed">
          <TableHeader>
            <TableHeadRow>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Execution / Job ID</TableHead>
            </TableHeadRow>
          </TableHeader>
          <Card asChild>
            <TableBody className="bg-transparent">
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <p className="text-secondary h-[100px]">
                      No executions found. Start by creating your first
                      execution.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => {
                  const isExpanded = expandedExecutionId === execution.id;
                  const isExecutionHighlighted =
                    highlightedIds?.executions.has(execution.id) ?? false;

                  return (
                    <Fragment key={execution.id}>
                      {/* Main Execution Row */}
                      <TableRow
                        data-state={isExpanded ? "selected" : "collapsed"}
                        className={cn(
                          "group/row relative cursor-pointer transition-colors",
                          isExpanded &&
                            "[&]:bg-surface-100 dark:[&]:!bg-[#1f1f23] [&:hover]:bg-surface-200 dark:[&:hover]:bg-[#18181b]",
                          isExecutionHighlighted && "animate-row-highlight"
                        )}
                        onClick={() => toggleExpand(execution.id)}
                      >
                        <TableCell className="text-sm text-secondary">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={`w-4 h-4 text-secondary transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                            {formatDate(execution.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={execution.status} />
                        </TableCell>
                        <TableCell className="text-sm text-secondary">
                          {
                            execution.jobs.filter(
                              (job) => job.status === "completed"
                            ).length
                          }{" "}
                          / {execution.jobs.length}{" "}
                          {execution.jobs.length === 1 ? "job" : "jobs"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-left hover:text-primary transition-colors cursor-pointer">
                                  {truncateId(execution.id)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{execution.id}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Job Rows */}
                      {isExpanded &&
                        execution.jobs.map((job) => (
                          <ExecutionJobRow
                            key={job.id}
                            job={job}
                            onJobClick={handleJobClick}
                            isHighlighted={
                              highlightedIds?.jobs.has(job.id) ?? false
                            }
                          />
                        ))}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Card>
        </table>
        {showPagination && paginationProps && (
          <TableNavigation {...paginationProps} />
        )}
      </CardRoot>

      {/* Job Details Sheet */}
      <ExecutionJobSheet
        job={selectedJob}
        allJobs={getAllJobsForSelectedJob()}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
