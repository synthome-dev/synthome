import { Execution, ExecutionJob } from "../types";

export interface ChangedIds {
  executions: Set<string>;
  jobs: Set<string>;
}

/**
 * Compares two arrays of executions and returns IDs of changed items.
 * Changes include: new executions, status changes, new jobs, job status/progress changes.
 */
export function diffExecutions(
  prevExecutions: Execution[] | undefined,
  nextExecutions: Execution[],
): ChangedIds {
  const changedIds: ChangedIds = {
    executions: new Set(),
    jobs: new Set(),
  };

  // If no previous data, don't highlight anything (initial load)
  if (!prevExecutions || prevExecutions.length === 0) {
    return changedIds;
  }

  // Create a map of previous executions for quick lookup
  const prevExecutionMap = new Map<string, Execution>();
  const prevJobMap = new Map<string, ExecutionJob>();

  for (const execution of prevExecutions) {
    prevExecutionMap.set(execution.id, execution);
    for (const job of execution.jobs) {
      prevJobMap.set(job.id, job);
    }
  }

  // Check each execution in the new data
  for (const execution of nextExecutions) {
    const prevExecution = prevExecutionMap.get(execution.id);

    // New execution
    if (!prevExecution) {
      changedIds.executions.add(execution.id);
      // Also mark all its jobs as new
      for (const job of execution.jobs) {
        changedIds.jobs.add(job.id);
      }
      continue;
    }

    // Check if execution status changed
    if (prevExecution.status !== execution.status) {
      changedIds.executions.add(execution.id);
    }

    // Check if execution completed
    if (!prevExecution.completedAt && execution.completedAt) {
      changedIds.executions.add(execution.id);
    }

    // Check jobs within this execution
    for (const job of execution.jobs) {
      const prevJob = prevJobMap.get(job.id);

      // New job
      if (!prevJob) {
        changedIds.jobs.add(job.id);
        changedIds.executions.add(execution.id); // Parent execution also highlighted
        continue;
      }

      // Job status changed
      if (prevJob.status !== job.status) {
        changedIds.jobs.add(job.id);
        changedIds.executions.add(execution.id);
        continue;
      }

      // Job progress changed
      if (hasProgressChanged(prevJob.progress, job.progress)) {
        changedIds.jobs.add(job.id);
        continue;
      }

      // Job completed
      if (!prevJob.completedAt && job.completedAt) {
        changedIds.jobs.add(job.id);
        changedIds.executions.add(execution.id);
      }
    }
  }

  return changedIds;
}

/**
 * Compare progress objects for meaningful changes
 */
function hasProgressChanged(
  prev: ExecutionJob["progress"],
  next: ExecutionJob["progress"],
): boolean {
  // Both null/undefined - no change
  if (!prev && !next) return false;

  // One is null, other is not - changed
  if (!prev || !next) return true;

  // Compare percentage
  if (prev.percentage !== next.percentage) return true;

  // Compare stage
  if (prev.stage !== next.stage) return true;

  return false;
}

/**
 * Merges partial execution updates into the full dataset.
 * Used when polling with activeOnly=true to merge active/new executions
 * into the cached full dataset.
 */
export function mergeExecutions(
  currentExecutions: Execution[],
  updatedExecutions: Execution[],
): Execution[] {
  // Create a map of current executions
  const executionMap = new Map<string, Execution>();
  for (const execution of currentExecutions) {
    executionMap.set(execution.id, execution);
  }

  // Update/add executions from the partial update
  for (const updated of updatedExecutions) {
    executionMap.set(updated.id, updated);
  }

  // Convert back to array and sort by createdAt (newest first)
  const merged = Array.from(executionMap.values());
  merged.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return merged;
}
