import { db, eq, executionJobs, executions } from "@repo/db";
import { nanoid } from "nanoid";
import { JobClient } from "../client/job-client";

interface ExecutionPlan {
  jobs: JobNode[];
  baseExecutionId?: string;
}

interface JobNode {
  id: string;
  type?: string; // For backward compatibility
  operation?: string; // New field
  params: Record<string, unknown>;
  dependsOn?: string[]; // For backward compatibility
  dependencies?: string[]; // New field
  output?: string; // Make optional
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
    options: CreateExecutionOptions = {}
  ): Promise<string> {
    const executionId = nanoid();

    const jobRecords = executionPlan.jobs.map((job) => ({
      id: nanoid(),
      executionId,
      jobId: job.id,
      pgBossJobId: null,
      status: "pending",
      operation: job.operation || job.type || "",
      dependencies: job.dependencies || job.dependsOn || [],
      metadata: {
        params: job.params,
        output: job.output,
        attempts: 0,
      },
    }));

    // Insert execution first (jobs have FK constraint to execution)
    await db.insert(executions).values({
      id: executionId,
      status: "pending",
      executionPlan,
      baseExecutionId: options.baseExecutionId,
      webhookUrl: options.webhookUrl,
      webhookSecret: options.webhookSecret,
    });

    // Then insert jobs
    await db.insert(executionJobs).values(jobRecords);

    // Pass data we already have to avoid re-querying
    await this.emitReadyJobs(executionId, options.baseExecutionId);

    return executionId;
  }

  async emitReadyJobs(
    executionId: string,
    baseExecutionId?: string
  ): Promise<void> {
    // Fetch jobs in parallel
    const [allJobs, baseExecutionJobs] = await Promise.all([
      db.query.executionJobs.findMany({
        where: eq(executionJobs.executionId, executionId),
      }),
      baseExecutionId
        ? db.query.executionJobs.findMany({
            where: eq(executionJobs.executionId, baseExecutionId),
          })
        : Promise.resolve([]),
    ]);

    // Collect jobs to emit and emit them in parallel
    const jobsToEmit: Array<{ job: any; allJobs: any[]; baseJobs: any[] }> = [];

    for (const job of allJobs) {
      if (job.status !== "pending" || job.pgBossJobId) {
        continue;
      }

      const dependencies = (job.dependencies || []) as string[];
      if (dependencies.length === 0) {
        jobsToEmit.push({ job, allJobs, baseJobs: baseExecutionJobs });
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
        jobsToEmit.push({ job, allJobs, baseJobs: baseExecutionJobs });
      }
    }

    // Emit all ready jobs in parallel
    await Promise.all(
      jobsToEmit.map(({ job, allJobs, baseJobs }) =>
        this.emitJobWithData(executionId, job, allJobs, baseJobs)
      )
    );
  }

  private async emitJob(
    executionId: string,
    jobRecordId: string
  ): Promise<void> {
    // Fetch job and execution data in parallel
    const [job, execution] = await Promise.all([
      db.query.executionJobs.findFirst({
        where: eq(executionJobs.id, jobRecordId),
      }),
      db.query.executions.findFirst({
        where: eq(executions.id, executionId),
      }),
    ]);

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Fetch all jobs in parallel
    const [allJobs, baseExecutionJobs] = await Promise.all([
      db.query.executionJobs.findMany({
        where: eq(executionJobs.executionId, executionId),
      }),
      execution.baseExecutionId
        ? db.query.executionJobs.findMany({
            where: eq(executionJobs.executionId, execution.baseExecutionId),
          })
        : Promise.resolve([]),
    ]);

    await this.emitJobWithData(executionId, job, allJobs, baseExecutionJobs);
  }

  private async emitJobWithData(
    executionId: string,
    job: any,
    allJobs: any[],
    baseExecutionJobs: any[]
  ): Promise<void> {
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

    const pgBossJobId = await this.jobClient.emit(job.operation, jobData);

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
    completedJobId: string
  ): Promise<void> {
    // Fetch execution and jobs in parallel
    const [execution, allJobs] = await Promise.all([
      db.query.executions.findFirst({
        where: eq(executions.id, executionId),
      }),
      db.query.executionJobs.findMany({
        where: eq(executionJobs.executionId, executionId),
      }),
    ]);

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const completedJob = allJobs.find((j) => j.jobId === completedJobId);
    if (!completedJob) {
      throw new Error(
        `Job ${completedJobId} not found in execution ${executionId}`
      );
    }

    // Fetch base execution jobs if needed
    const baseExecutionJobs = execution.baseExecutionId
      ? await db.query.executionJobs.findMany({
          where: eq(executionJobs.executionId, execution.baseExecutionId),
        })
      : [];

    // Find jobs that depend on the completed job
    const jobsToEmit: any[] = [];
    const jobsToFail: any[] = [];

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

      const anyDependencyFailed = dependencies.some((depJobId) => {
        const depJob = allJobs.find((j) => j.jobId === depJobId);
        return depJob && depJob.status === "failed";
      });

      if (anyDependencyFailed) {
        // If any dependency failed, mark this job as failed too
        jobsToFail.push(job);
      } else if (allDependenciesCompleted) {
        // If all dependencies completed successfully, emit this job
        jobsToEmit.push(job);
      }
    }

    // Emit all dependent jobs in parallel
    if (jobsToEmit.length > 0) {
      await Promise.all(
        jobsToEmit.map((job) =>
          this.emitJobWithData(executionId, job, allJobs, baseExecutionJobs)
        )
      );
    }

    // Mark jobs as failed if their dependencies failed
    if (jobsToFail.length > 0) {
      await Promise.all(
        jobsToFail.map((job) =>
          db
            .update(executionJobs)
            .set({
              status: "failed",
              error: "Dependency job failed",
              completedAt: new Date(),
            })
            .where(eq(executionJobs.id, job.id))
        )
      );

      // Update the allJobs array to reflect the failed jobs
      jobsToFail.forEach((job) => {
        const index = allJobs.findIndex((j) => j.id === job.id);
        if (index !== -1) {
          allJobs[index]!.status = "failed" as any;
          allJobs[index]!.error = "Dependency job failed";
          allJobs[index]!.completedAt = new Date();
        }
      });
    }

    // Check if execution is complete (using updated allJobs)
    const allJobsCompleted = allJobs.every(
      (j) => j.status === "completed" || j.status === "failed"
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
