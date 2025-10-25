import type PgBoss from "pg-boss";

export interface VideoGenerationPrompt {
  prompt: string;
  [key: string]: any;
}

export interface JobOptions extends PgBoss.SendOptions {}

export interface Job<T extends object> {
  type: string;
  options: JobOptions;
  start: () => Promise<void>;
  work: (job: PgBoss.Job<T>) => Promise<void>;
  emit: (data: T, options?: Partial<JobOptions>) => Promise<string>;
}
