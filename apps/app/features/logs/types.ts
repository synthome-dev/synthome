export interface ExecutionJob {
  id: string;
  executionId: string;
  jobId: string;
  status: string;
  operation: string;
  dependencies: string[] | null;
  progress: { stage?: string; percentage?: number } | null;
  metadata: Record<string, any> | null;
  result: any | null;
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  providerJobId: string | null;
  providerJobStatus: string | null;
  waitingStrategy: "webhook" | "polling" | null;
  nextPollAt: Date | null;
  pollAttempts: number | null;
}

export interface Execution {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  error: string | null;
  actionsCounted: number | null;
  executionPlan: any;
  baseExecutionId: string | null;
  webhook: string | null;
  result: any | null;
  jobs: ExecutionJob[];
}

export type ExecutionStatus =
  | "pending"
  | "in_progress"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled";

export type JobStatus =
  | "pending"
  | "in_progress"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled";
