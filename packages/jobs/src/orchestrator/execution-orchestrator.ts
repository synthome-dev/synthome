import { nanoid } from "nanoid";
import { db, executions, executionJobs, eq } from "@repo/db";
import { JobClient } from "../client/job-client";

interface ExecutionPlan {
  jobs: JobNode[];
  baseExecutionId?: string;
}

interface JobNode {
  id: string;
  type: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
  output: string;
}

interface CreateExecutionOptions {
  webhookUrl?: string;
  webhookSecret?: string;
  baseExecutionId?: string;
}

export class ExecutionOrchestrator {
  private jobClient: JobClient;

  constructor() {
    this.jobClient = new JobClient();
  }

  async start() {
    await this.jobClient.start();
  }

  async stop() {
    await this.jobClient.stop();
  }

  async createExecution(
    executionPlan: ExecutionPlan,
    options: CreateExecutionOptions = {},
  ): Promise<string> {
    const executionId = nanoid();

    await db.insert(executions).values({
      id: executionId,
      status: "pending",
      executionPlan,
      baseExecutionId: options.baseExecutionId,
      webhookUrl: options.webhookUrl,
      webhookSecret: options.webhookSecret,
    });

    const jobRecords = executionPlan.jobs.map((job) => ({
      id: nanoid(),
      executionId,
      jobId: job.id,
      pgBossJobId: null,
      status: "pending",
      operation: job.type,
      dependencies: job.dependsOn || [],
      metadata: {
        params: job.params,
        output: job.output,
        attempts: 0,
      },
    }));

    await db.insert(executionJobs).values(jobRecords);

    await this.emitReadyJobs(executionId);

    return executionId;
  }

  async emitReadyJobs(executionId: string): Promise<void> {
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const allJobs = await db.query.executionJobs.findMany({
      where: eq(executionJobs.executionId, executionId),
    });

    const baseExecutionJobs = execution.baseExecutionId
      ? await db.query.executionJobs.findMany({
          where: eq(executionJobs.executionId, execution.baseExecutionId),
        })
      : [];

    for (const job of allJobs) {
      if (job.status !== "pending" || job.pgBossJobId) {
        continue;
      }

      const dependencies = (job.dependencies || []) as string[];
      if (dependencies.length === 0) {
        await this.emitJob(executionId, job.id);
        continue;
      }

      const allDependenciesCompleted = dependencies.every((depJobId) => {
        const depJob = allJobs.find((j) => j.jobId === depJobId);
        if (depJob) {
          return depJob.status === "completed";
        }

        const baseDepJob = baseExecutionJobs.find((j) => j.jobId === depJobId);
        return baseDepJob && baseDepJob.status === "completed";
      });

      if (allDependenciesCompleted) {
        await this.emitJob(executionId, job.id);
      }
    }
  }

  private async emitJob(
    executionId: string,
    jobRecordId: string,
  ): Promise<void> {
    const job = await db.query.executionJobs.findFirst({
      where: eq(executionJobs.id, jobRecordId),
    });

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const allJobs = await db.query.executionJobs.findMany({
      where: eq(executionJobs.executionId, executionId),
    });

    const baseExecutionJobs = execution.baseExecutionId
      ? await db.query.executionJobs.findMany({
          where: eq(executionJobs.executionId, execution.baseExecutionId),
        })
      : [];

    const dependencies = (job.dependencies || []) as string[];
    const dependencyResults: Record<string, any> = {};

    for (const depJobId of dependencies) {
      const depJob = allJobs.find((j) => j.jobId === depJobId);
      if (depJob?.result) {
        dependencyResults[depJobId] = depJob.result;
      } else {
        const baseDepJob = baseExecutionJobs.find((j) => j.jobId === depJobId);
        if (baseDepJob?.result) {
          dependencyResults[depJobId] = baseDepJob.result;
        }
      }
    }

    const jobData = {
      executionId,
      jobRecordId: job.id,
      jobId: job.jobId,
      operation: job.operation,
      params: (job.metadata as any)?.params || {},
      dependencies: dependencyResults,
    };

    const pgBossJobId = await this.jobClient.emit(
      `pipeline:${job.operation}`,
      jobData,
    );

    await db
      .update(executionJobs)
      .set({
        pgBossJobId,
        status: "processing",
        startedAt: new Date(),
      })
      .where(eq(executionJobs.id, job.id));
  }

  async checkAndEmitDependentJobs(
    executionId: string,
    completedJobId: string,
  ): Promise<void> {
    const allJobs = await db.query.executionJobs.findMany({
      where: eq(executionJobs.executionId, executionId),
    });

    const completedJob = allJobs.find((j) => j.jobId === completedJobId);
    if (!completedJob) {
      throw new Error(
        `Job ${completedJobId} not found in execution ${executionId}`,
      );
    }

    for (const job of allJobs) {
      if (job.status !== "pending" || job.pgBossJobId) {
        continue;
      }

      const dependencies = (job.dependencies || []) as string[];
      if (!dependencies.includes(completedJobId)) {
        continue;
      }

      const allDependenciesCompleted = dependencies.every((depJobId) => {
        const depJob = allJobs.find((j) => j.jobId === depJobId);
        return depJob && depJob.status === "completed";
      });

      if (allDependenciesCompleted) {
        await this.emitJob(executionId, job.id);
      }
    }

    const allJobsCompleted = allJobs.every(
      (j) => j.status === "completed" || j.status === "failed",
    );

    if (allJobsCompleted) {
      const hasFailures = allJobs.some((j) => j.status === "failed");
      await db
        .update(executions)
        .set({
          status: hasFailures ? "failed" : "completed",
          completedAt: new Date(),
        })
        .where(eq(executions.id, executionId));
    }
  }
}

let orchestratorInstance: ExecutionOrchestrator | null = null;

export const getOrchestrator = async (): Promise<ExecutionOrchestrator> => {
  if (!orchestratorInstance) {
    orchestratorInstance = new ExecutionOrchestrator();
    await orchestratorInstance.start();
  }
  return orchestratorInstance;
};
