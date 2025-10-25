import { executionJobs, executions } from "./schema";

export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;

export type ExecutionJob = typeof executionJobs.$inferSelect;
export type NewExecutionJob = typeof executionJobs.$inferInsert;

export type ExecutionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";
export type JobStatus = "pending" | "in_progress" | "completed" | "failed";
export type JobOperation =
  | "generateVideo"
  | "merge"
  | "reframe"
  | "lipSync"
  | "addSubtitles";

export interface ExecutionPlan {
  jobs: Array<{
    id: string;
    operation: JobOperation;
    params: Record<string, any>;
    dependsOn?: string[];
  }>;
  rootJobIds: string[];
  baseExecutionId?: string;
}

export interface ExecutionResult {
  url: string;
  outputs: Record<string, any>;
}
