# Step 11: Base Execution Support

## Overview

Implement support for execution dependencies using baseExecutionId to reuse outputs from previous executions.

## Files to Modify

- `apps/be/src/services/execution-orchestrator.ts`
- `packages/jobs/src/jobs/pipeline/generate-video-job.ts`

## Update Orchestrator

### execution-orchestrator.ts

```typescript
export class ExecutionOrchestrator {
  async createExecution(
    executionPlan: ExecutionPlan,
    options?: {
      baseExecutionId?: string;
      webhookUrl?: string;
      webhookSecret?: string;
    },
  ) {
    const executionId = generateId();

    // Verify base execution if provided
    let baseExecutionOutputs: Record<string, any> = {};
    if (options?.baseExecutionId) {
      baseExecutionOutputs = await this.getBaseExecutionOutputs(
        options.baseExecutionId,
      );
    }

    await db.insert(executions).values({
      id: executionId,
      status: "pending",
      executionPlan: {
        ...executionPlan,
        baseExecutionId: options?.baseExecutionId,
      },
      baseExecutionId: options?.baseExecutionId,
      webhookUrl: options?.webhookUrl,
      webhookSecret: options?.webhookSecret,
    });

    const jobMapping = new Map<string, string>();

    for (const job of executionPlan.jobs) {
      // Skip job if output exists in base execution
      if (baseExecutionOutputs[job.id]) {
        await this.createReferenceJob(
          executionId,
          job,
          baseExecutionOutputs[job.id],
        );
        continue;
      }

      const pgBossJobId = await this.createJob(
        executionId,
        job,
        jobMapping,
        baseExecutionOutputs,
      );
      jobMapping.set(job.id, pgBossJobId);

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

    if (options?.webhookUrl) {
      await this.createWebhookJob(
        executionId,
        options.webhookUrl,
        options.webhookSecret,
      );
    }

    return executionId;
  }

  private async getBaseExecutionOutputs(
    baseExecutionId: string,
  ): Promise<Record<string, any>> {
    const [baseExecution] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, baseExecutionId))
      .limit(1);

    if (!baseExecution) {
      throw new Error(`Base execution not found: ${baseExecutionId}`);
    }

    if (baseExecution.status !== "completed") {
      throw new Error(
        `Base execution not completed: ${baseExecutionId} (${baseExecution.status})`,
      );
    }

    const baseJobs = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.executionId, baseExecutionId));

    return baseJobs.reduce(
      (acc, job) => {
        if (job.result) {
          acc[job.jobId] = job.result;
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  private async createReferenceJob(executionId: string, job: Job, result: any) {
    await db.insert(executionJobs).values({
      id: nanoid(),
      executionId,
      jobId: job.id,
      pgBossJobId: "reference",
      status: "completed",
      operation: job.operation,
      dependencies: job.dependsOn || [],
      result,
      completedAt: new Date(),
    });
  }

  private async createJob(
    executionId: string,
    job: Job,
    jobMapping: Map<string, string>,
    baseOutputs: Record<string, any>,
  ): Promise<string> {
    const dependencies = (job.dependsOn || [])
      .filter((depId) => !baseOutputs[depId]) // Exclude base outputs
      .map((depId) => jobMapping.get(depId))
      .filter(Boolean) as string[];

    const jobType = this.getJobType(job.operation);

    return await jobManager.createJob(
      jobType,
      {
        executionId,
        jobId: job.id,
        baseOutputs, // Pass base outputs to job
        ...job.params,
      },
      {
        dependencies,
      },
    );
  }
}
```

## Update Jobs to Use Base Outputs

### Example: generate-video-job.ts

```typescript
interface GenerateVideoParams {
  executionId: string;
  jobId: string;
  provider: "replicate" | "fal" | "google-cloud";
  model: string;
  params: Record<string, any>;
  baseOutputs?: Record<string, any>; // NEW
}

export class GenerateVideoJob extends BaseJob<GenerateVideoParams> {
  async execute(data: GenerateVideoParams): Promise<void> {
    // Check if we can reuse base output
    if (data.baseOutputs?.[data.jobId]) {
      console.log(`Reusing output from base execution for job ${data.jobId}`);
      await this.saveResult(data, data.baseOutputs[data.jobId].url);
      await this.updateJobStatus("completed");
      return;
    }

    // Normal execution flow...
    await this.updateJobStatus("in_progress");

    try {
      const videoUrl = await this.callProvider(data);
      const s3Url = await this.uploadVideo(
        videoUrl,
        data.executionId,
        data.jobId,
      );
      await this.saveResult(data, s3Url);
      await this.updateJobStatus("completed");
    } catch (error) {
      await this.updateJobStatus("failed", error);
      throw error;
    }
  }
}
```

## Testing

```typescript
// Create base execution
const baseExec = await productDemo.execute();
await baseExec.onComplete(); // Wait for completion

// Create variant that reuses base
const frenchVersion = compose(productDemo)
  .lipSync({ audioUrl: "fr.mp3" })
  .addSubtitles({ text: "Bonjour!" });

const variantExec = await frenchVersion.execute({
  baseExecutionId: baseExec.id,
});

// Should skip generateVideo job and only run lipSync + addSubtitles
```

## Completion Criteria

- [ ] Orchestrator validates base execution exists
- [ ] Base execution must be completed
- [ ] Jobs reuse base outputs when available
- [ ] Only new operations are executed
- [ ] Dependencies work across base/variant
