import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  executionPlan: jsonb("execution_plan").notNull(),
  baseExecutionId: text("base_execution_id"),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const executionJobs = pgTable("execution_jobs", {
  id: text("id").primaryKey(),
  executionId: text("execution_id")
    .notNull()
    .references(() => executions.id),
  jobId: text("job_id").notNull(),
  pgBossJobId: text("pgboss_job_id"),
  status: text("status").notNull(),
  operation: text("operation").notNull(),
  dependencies: jsonb("dependencies").$type<string[]>(),
  progress: jsonb("progress").$type<{ stage?: string; percentage?: number }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  result: jsonb("result"),
  error: text("error"),

  // Async provider job tracking
  providerJobId: text("provider_job_id"),
  providerJobStatus: text("provider_job_status"),
  waitingStrategy: text("waiting_strategy").$type<"webhook" | "polling">(),
  nextPollAt: timestamp("next_poll_at"),
  pollAttempts: integer("poll_attempts").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});
