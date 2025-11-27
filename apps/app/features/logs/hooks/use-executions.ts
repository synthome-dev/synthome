import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Execution } from "../types";
import {
  ChangedIds,
  diffExecutions,
  mergeExecutions,
} from "../utils/diff-executions";

interface ExecutionsResponse {
  success: boolean;
  data?: {
    executions: Execution[];
    total: number;
    page: number;
    limit: number;
    activeOnly?: boolean;
    timestamp?: string;
  };
  error?: string;
}

interface UseExecutionsOptions {
  page: number;
  limit: number;
  initialData?: {
    executions: Execution[];
    total: number;
  };
  refreshInterval?: number;
}

interface UseExecutionsReturn {
  executions: Execution[];
  total: number;
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  highlightedIds: ChangedIds;
  mutate: () => void;
}

const HIGHLIGHT_DURATION = 1000; // 1 second
const ACTIVE_STATUSES = ["pending", "in_progress", "waiting"];

/**
 * Get IDs of executions that have active status or contain active jobs
 */
function getActiveExecutionIds(executions: Execution[]): string[] {
  const activeIds: string[] = [];

  for (const execution of executions) {
    // Check if execution itself is active
    if (ACTIVE_STATUSES.includes(execution.status)) {
      activeIds.push(execution.id);
      continue;
    }

    // Check if any job is active
    const hasActiveJob = execution.jobs.some((job) =>
      ACTIVE_STATUSES.includes(job.status),
    );
    if (hasActiveJob) {
      activeIds.push(execution.id);
    }
  }

  return activeIds;
}

export function useExecutions({
  page,
  limit,
  initialData,
  refreshInterval = 3500,
}: UseExecutionsOptions): UseExecutionsReturn {
  // Track merged executions (combines cached + active updates)
  const [mergedExecutions, setMergedExecutions] = useState<Execution[]>(
    initialData?.executions ?? [],
  );
  const [total, setTotal] = useState(initialData?.total ?? 0);

  // Track highlighted IDs
  const [highlightedIds, setHighlightedIds] = useState<ChangedIds>({
    executions: new Set(),
    jobs: new Set(),
  });

  // Use refs for values that shouldn't trigger re-renders/URL changes
  const lastTimestampRef = useRef<string | undefined>(undefined);
  const watchIdsRef = useRef<string[]>(
    getActiveExecutionIds(initialData?.executions ?? []),
  );
  const hasInitialDataRef = useRef(!!initialData);
  const prevExecutionsRef = useRef<Execution[]>(initialData?.executions ?? []);

  // Base URL - only changes when page/limit changes
  const baseUrl = `/api/executions?page=${page}&limit=${limit}`;

  // Fetcher function that builds the actual URL using current ref values
  const fetchExecutions = useCallback(
    async (key: string): Promise<ExecutionsResponse> => {
      let fetchUrl = key;

      // If we have initial data and a timestamp, use activeOnly mode
      if (hasInitialDataRef.current && lastTimestampRef.current) {
        fetchUrl = `${key}&activeOnly=true&since=${encodeURIComponent(lastTimestampRef.current)}`;

        // Add watchIds if we have any
        if (watchIdsRef.current.length > 0) {
          fetchUrl += `&watchIds=${encodeURIComponent(watchIdsRef.current.join(","))}`;
        }
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) {
        throw new Error("Failed to fetch executions");
      }
      return res.json();
    },
    [], // No dependencies - refs don't need to be in deps
  );

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<ExecutionsResponse>(baseUrl, fetchExecutions, {
      refreshInterval,
      revalidateOnFocus: true,
    });

  // Process response data
  useEffect(() => {
    if (!data?.data) return;

    const responseData = data.data;
    const newExecutions = responseData.executions;

    // Update timestamp for next request
    if (responseData.timestamp) {
      lastTimestampRef.current = responseData.timestamp;
    }

    // Update total
    setTotal(responseData.total);

    if (responseData.activeOnly) {
      // Partial update: merge with existing data
      const merged = mergeExecutions(prevExecutionsRef.current, newExecutions);

      // Update watchIds based on merged data - track any execution that's still active
      watchIdsRef.current = getActiveExecutionIds(merged);

      // Detect changes for highlighting
      const changedIds = diffExecutions(prevExecutionsRef.current, merged);

      if (changedIds.executions.size > 0 || changedIds.jobs.size > 0) {
        setHighlightedIds(changedIds);

        // Clear highlights after duration
        setTimeout(() => {
          setHighlightedIds({
            executions: new Set(),
            jobs: new Set(),
          });
        }, HIGHLIGHT_DURATION);
      }

      prevExecutionsRef.current = merged;
      setMergedExecutions(merged);
    } else {
      // Full fetch: replace all data
      const changedIds = diffExecutions(
        prevExecutionsRef.current,
        newExecutions,
      );

      // Set initial watchIds from full fetch
      watchIdsRef.current = getActiveExecutionIds(newExecutions);

      if (changedIds.executions.size > 0 || changedIds.jobs.size > 0) {
        setHighlightedIds(changedIds);

        setTimeout(() => {
          setHighlightedIds({
            executions: new Set(),
            jobs: new Set(),
          });
        }, HIGHLIGHT_DURATION);
      }

      prevExecutionsRef.current = newExecutions;
      setMergedExecutions(newExecutions);
      hasInitialDataRef.current = true;
    }
  }, [data]);

  // Reset when page changes
  useEffect(() => {
    // Reset refs when page changes to force full fetch
    lastTimestampRef.current = undefined;
    hasInitialDataRef.current = false;
    watchIdsRef.current = [];
    prevExecutionsRef.current = [];
  }, [page, limit]);

  const handleMutate = useCallback(() => {
    // Reset to trigger full fetch
    lastTimestampRef.current = undefined;
    hasInitialDataRef.current = false;
    watchIdsRef.current = [];
    mutate();
  }, [mutate]);

  return {
    executions: mergedExecutions,
    total,
    isLoading,
    isValidating,
    error: data?.success === false ? data.error : error?.message,
    highlightedIds,
    mutate: handleMutate,
  };
}
