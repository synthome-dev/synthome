# Step 3: Job Orchestration

## Overview

Create the orchestration layer that converts SDK execution plans into PgBoss jobs with proper dependencies.

## Files to Create

- `apps/be/src/services/execution-orchestrator.ts`

## Implementation

```typescript
import { db } from "@repo/db";
import { executions, executionJobs } from "@repo/db/schema";
import { jobManager } from "@repo/jobs";
import type { ExecutionPlan, Job } from "@repo/ai-video-sdk";

export class ExecutionOrchestrator {
  async createExecution(
    executionPlan: ExecutionPlan,
    options?: {
      baseExecutionId?: string;
      webhookUrl?: string;
      webhookSecret?: string;
    },
  ) {
    const executionId = nanoid();

    // Insert execution record
    await db.insert(executions).values({
      id: executionId,
      status: "pending",
      executionPlan,
      baseExecutionId: options?.baseExecutionId,
      webhookUrl: options?.webhookUrl,
      webhookSecret: options?.webhookSecret,
    });

    // Create PgBoss jobs with dependencies
    const jobMapping = new Map<string, string>(); // SDK jobId -> PgBoss jobId

    for (const job of executionPlan.jobs) {
      const pgBossJobId = await this.createJob(executionId, job, jobMapping);
      jobMapping.set(job.id, pgBossJobId);

      // Track in execution_jobs table
      await db.insert(executionJobs).values({
        id: nanoid(),
        executionId,
        jobId: job.id,
        pgBossJobId,
        status: "pending",
        operation: job.operation,
        dependencies: job.dependsOn || [],
      });
    }

    // Create webhook job if configured
    if (options?.webhookUrl) {
      await this.createWebhookJob(
        executionId,
        options.webhookUrl,
        options.webhookSecret,
      );
    }

    return executionId;
  }

  private async createJob(
    executionId: string,
    job: Job,
    jobMapping: Map<string, string>,
  ): Promise<string> {
    const dependencies = (job.dependsOn || [])
      .map((depId) => jobMapping.get(depId))
      .filter(Boolean) as string[];

    const jobType = this.getJobType(job.operation);

    return await jobManager.createJob(
      jobType,
      {
        executionId,
        jobId: job.id,
        ...job.params,
      },
      {
        dependencies,
      },
    );
  }

  private getJobType(operation: string): string {
    const jobTypeMap: Record<string, string> = {
      generateVideo: "pipeline:generate-video",
      merge: "pipeline:merge-videos",
      reframe: "pipeline:reframe-video",
      lipSync: "pipeline:lip-sync",
      addSubtitles: "pipeline:add-subtitles",
    };
    return jobTypeMap[operation] || operation;
  }

  private async createWebhookJob(
    executionId: string,
    webhookUrl: string,
    webhookSecret?: string,
  ) {
    // Webhook job depends on all jobs in execution
    const allJobs = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.executionId, executionId));

    const dependencies = allJobs.map((j) => j.pgBossJobId);

    await jobManager.createJob(
      "pipeline:webhook-delivery",
      {
        executionId,
        webhookUrl,
        webhookSecret,
      },
      {
        dependencies,
      },
    );
  }
}

export const executionOrchestrator = new ExecutionOrchestrator();
```

## Update Execute Endpoint

Modify `apps/be/src/routes/execute.ts`:

```typescript
import { executionOrchestrator } from "../services/execution-orchestrator";

executeRouter.post("/", async (c) => {
  const { executionPlan, options } = await c.req.json();

  const executionId = await executionOrchestrator.createExecution(
    executionPlan,
    options,
  );

  return c.json(
    {
      id: executionId,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    202,
  );
});
```

## Completion Criteria

- [ ] ExecutionOrchestrator class created
- [ ] Converts SDK jobs to PgBoss jobs
- [ ] Maps dependencies correctly
- [ ] Creates webhook delivery job
- [ ] Execute endpoint uses orchestrator
