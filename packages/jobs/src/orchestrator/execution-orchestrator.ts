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
    options: CreateExecutionOptions = {},
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
    baseExecutionId?: string,
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
        this.emitJobWithData(executionId, job, allJobs, baseJobs),
      ),
    );
  }

  private async emitJob(
    executionId: string,
    jobRecordId: string,
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
    baseExecutionJobs: any[],
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

    // Resolve image job dependencies in params
    let params = (job.metadata as any)?.params || {};
    if (params.image && typeof params.image === "string") {
      const imageDepMarker = params.image as string;
      if (imageDepMarker.startsWith("_imageJobDependency:")) {
        const imageJobId = imageDepMarker.replace("_imageJobDependency:", "");
        const imageJob = allJobs.find((j) => j.jobId === imageJobId);

        if (imageJob?.result) {
          // Extract image URL from the result
          // The result format from parseReplicateImage:
          // { status: "completed", outputs: [{ type: "image", url: "...", mimeType: "..." }], metadata: {...} }
          const result = imageJob.result;
          if (
            result.outputs &&
            Array.isArray(result.outputs) &&
            result.outputs.length > 0
          ) {
            const imageUrl = result.outputs[0].url;
            if (imageUrl) {
              params = { ...params, image: imageUrl };
              console.log(
                `[Orchestrator] Resolved image dependency ${imageJobId} to URL: ${imageUrl}`,
              );
            } else {
              throw new Error(`Image job ${imageJobId} output has no URL`);
            }
          } else {
            console.error(
              `[Orchestrator] Image job ${imageJobId} has invalid result format:`,
              imageJob.result,
            );
            throw new Error(
              `Image job ${imageJobId} did not produce a valid image URL`,
            );
          }
        } else {
          console.error(
            `[Orchestrator] Image job ${imageJobId} not found or has no result`,
          );
          throw new Error(`Image job dependency ${imageJobId} not found`);
        }
      }
    }

    // Resolve audio job dependencies in params
    if (params.audio && typeof params.audio === "string") {
      const audioDepMarker = params.audio as string;
      if (audioDepMarker.startsWith("_audioJobDependency:")) {
        const audioJobId = audioDepMarker.replace("_audioJobDependency:", "");
        const audioJob = allJobs.find((j) => j.jobId === audioJobId);

        if (audioJob?.result) {
          // Extract audio URL from the result
          // The result format from parseReplicateAudio:
          // { status: "completed", outputs: [{ type: "audio", url: "...", mimeType: "..." }], metadata: {...} }
          const result = audioJob.result;
          if (
            result.outputs &&
            Array.isArray(result.outputs) &&
            result.outputs.length > 0
          ) {
            const audioUrl = result.outputs[0].url;
            if (audioUrl) {
              params = { ...params, audio: audioUrl };
              console.log(
                `[Orchestrator] Resolved audio dependency ${audioJobId} to URL: ${audioUrl}`,
              );
            } else {
              throw new Error(`Audio job ${audioJobId} output has no URL`);
            }
          } else {
            console.error(
              `[Orchestrator] Audio job ${audioJobId} has invalid result format:`,
              audioJob.result,
            );
            throw new Error(
              `Audio job ${audioJobId} did not produce a valid audio URL`,
            );
          }
        } else {
          console.error(
            `[Orchestrator] Audio job ${audioJobId} not found or has no result`,
          );
          throw new Error(`Audio job dependency ${audioJobId} not found`);
        }
      }
    }

    const jobData = {
      executionId,
      jobRecordId: job.id,
      jobId: job.jobId,
      operation: job.operation,
      params,
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
    completedJobId: string,
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
        `Job ${completedJobId} not found in execution ${executionId}`,
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
          this.emitJobWithData(executionId, job, allJobs, baseExecutionJobs),
        ),
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
            .where(eq(executionJobs.id, job.id)),
        ),
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
