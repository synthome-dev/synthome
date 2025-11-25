import { Check, Clock } from "lucide-react";
import { ExecutionJob } from "./types";

interface DependencyStatusProps {
  dependencies: string[] | null;
  allJobs: ExecutionJob[];
}

export function DependencyStatus({
  dependencies,
  allJobs,
}: DependencyStatusProps) {
  if (!dependencies || dependencies.length === 0) {
    return <div className="text-sm text-secondary">No dependencies</div>;
  }

  // Create a map of job IDs to their status for quick lookup
  const jobStatusMap = new Map(allJobs.map((job) => [job.jobId, job.status]));

  return (
    <div className="space-y-2">
      {dependencies.map((depId) => {
        const status = jobStatusMap.get(depId);
        const isCompleted = status === "completed";

        return (
          <div key={depId} className="flex items-center gap-2 text-sm">
            {isCompleted ? (
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            )}
            <span className="font-mono text-xs text-secondary">{depId}</span>
            {status && (
              <span
                className={`text-xs ${
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                ({status})
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
