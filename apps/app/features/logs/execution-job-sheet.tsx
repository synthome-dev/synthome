"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ExecutionJob } from "./types";
import { StatusBadge } from "./status-badge";
import { DependencyStatus } from "./dependency-status";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface ExecutionJobSheetProps {
  job: ExecutionJob | null;
  allJobs: ExecutionJob[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutionJobSheet({
  job,
  allJobs,
  open,
  onOpenChange,
}: ExecutionJobSheetProps) {
  if (!job) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <span className="font-mono text-sm">{job.jobId}</span>
            <StatusBadge status={job.status} />
          </SheetTitle>
          <SheetDescription className="text-base">
            {job.operation}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Section */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-2">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">Current:</span>
                <StatusBadge status={job.status} />
              </div>
              {job.providerJobId && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Provider Job ID:</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {job.providerJobId}
                    </code>
                  </div>
                  {job.providerJobStatus && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-secondary">Provider Status:</span>
                      <StatusBadge status={job.providerJobStatus} />
                    </div>
                  )}
                  {job.waitingStrategy && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-secondary">Waiting Strategy:</span>
                      <span className="text-primary capitalize">
                        {job.waitingStrategy}
                      </span>
                    </div>
                  )}
                  {job.pollAttempts !== null && job.pollAttempts > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-secondary">Poll Attempts:</span>
                      <span className="text-primary">{job.pollAttempts}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <Separator />

          {/* Dependencies Section */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">
              Dependencies
            </h3>
            <DependencyStatus
              dependencies={job.dependencies}
              allJobs={allJobs}
            />
          </section>

          <Separator />

          {/* Metadata Section */}
          {job.metadata && Object.keys(job.metadata).length > 0 && (
            <>
              <section>
                <h3 className="text-sm font-medium text-primary mb-3">
                  Metadata
                </h3>
                <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto">
                  <code>{JSON.stringify(job.metadata, null, 2)}</code>
                </pre>
              </section>
              <Separator />
            </>
          )}

          {/* Result Section */}
          {job.result && (
            <>
              <section>
                <h3 className="text-sm font-medium text-primary mb-3">
                  Result
                </h3>
                <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs overflow-x-auto">
                  <code>{JSON.stringify(job.result, null, 2)}</code>
                </pre>
              </section>
              <Separator />
            </>
          )}

          {/* Error Section */}
          {job.error && (
            <>
              <section>
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                  Error
                </h3>
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                  <pre className="text-xs text-red-800 dark:text-red-200 whitespace-pre-wrap">
                    {job.error}
                  </pre>
                </div>
              </section>
              <Separator />
            </>
          )}

          {/* Timestamps Section */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">
              Timestamps
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-secondary block">Created</span>
                <span className="text-primary font-mono text-xs">
                  {formatDate(job.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Started</span>
                <span className="text-primary font-mono text-xs">
                  {formatDate(job.startedAt)}
                </span>
              </div>
              <div>
                <span className="text-secondary block">Completed</span>
                <span className="text-primary font-mono text-xs">
                  {formatDate(job.completedAt)}
                </span>
              </div>
              {job.nextPollAt && (
                <div>
                  <span className="text-secondary block">Next Poll</span>
                  <span className="text-primary font-mono text-xs">
                    {formatDate(job.nextPollAt)}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* IDs Section */}
          <section>
            <h3 className="text-sm font-medium text-primary mb-3">
              Identifiers
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-secondary block">Job ID</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {job.jobId}
                </code>
              </div>
              <div>
                <span className="text-secondary block">Execution ID</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {job.executionId}
                </code>
              </div>
              <div>
                <span className="text-secondary block">Database ID</span>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {job.id}
                </code>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
