# Step 1: Database Schema

## Overview

Create database tables to track pipeline executions and their associated jobs.

## Files to Modify

- `packages/db/src/db/schema.ts`
- Create new migration file: `packages/db/drizzle/0003_add_pipeline_execution_tables.sql`

## Schema Design

### executions table

```typescript
export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  status: text("status").notNull(), // 'pending' | 'in_progress' | 'completed' | 'failed'
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
```

### execution_jobs table

```typescript
export const executionJobs = pgTable("execution_jobs", {
  id: text("id").primaryKey(),
  executionId: text("execution_id")
    .notNull()
    .references(() => executions.id),
  jobId: text("job_id").notNull(), // SDK job ID
  pgBossJobId: text("pgboss_job_id").notNull(),
  status: text("status").notNull(), // 'pending' | 'in_progress' | 'completed' | 'failed'
  operation: text("operation").notNull(), // 'generateVideo' | 'merge' | etc
  dependencies: jsonb("dependencies").$type<string[]>(),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
```

## Implementation Steps

1. Add tables to `packages/db/src/db/schema.ts`
2. Export tables from schema file
3. Create migration SQL file
4. Run migration: `bun run db:migrate`

## Testing

```bash
# Verify tables exist
psql $DATABASE_URL -c "\d executions"
psql $DATABASE_URL -c "\d execution_jobs"
```

## Completion Criteria

- [ ] Tables created in schema.ts
- [ ] Migration file generated
- [ ] Migration applied successfully
- [ ] Can query both tables without errors
