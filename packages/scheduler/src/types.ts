export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled?: boolean;
}

export interface JobResult {
  success: boolean;
  error?: Error;
  data?: any;
}

export interface SchedulerOptions {
  timezone?: string;
  runOnInit?: boolean;
}
