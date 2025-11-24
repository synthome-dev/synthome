import { db, eq, executionJobs, executions } from "@repo/db";
import { generateId } from "@repo/tools";
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
  webhook?: string;
  webhookSecret?: string;
  baseExecutionId?: string;
  organizationId?: string;
  apiKeyId?: string;
  providerApiKeys?: {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
    hume?: string;
    elevenlabs?: string;
  };
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
    const executionId = generateId();

    const jobRecords = executionPlan.jobs.map((job) => ({
      id: generateId(),
      executionId,
      jobId: job.id,
      pgBossJobId: null,
      status: "pending",
      operation: job.operation || job.type || "",
      dependencies: job.dependencies || job.dependsOn || [],
      organizationId: options.organizationId,
      actionLogged: false,
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
      webhook: options.webhook,
      webhookSecret: options.webhookSecret,
      organizationId: options.organizationId,
      apiKeyId: options.apiKeyId,
      providerApiKeys: options.providerApiKeys,
      actionsCounted: 0,
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

    // Resolve video job dependencies in params
    if (params.video && typeof params.video === "string") {
      const videoDepMarker = params.video as string;
      if (videoDepMarker.startsWith("_videoJobDependency:")) {
        const videoJobId = videoDepMarker.replace("_videoJobDependency:", "");
        const videoJob = allJobs.find((j) => j.jobId === videoJobId);

        if (videoJob?.result) {
          // Extract video URL from the result
          // The result format is:
          // { status: "completed", outputs: [{ type: "video", url: "...", mimeType: "..." }], metadata: {...} }
          const result = videoJob.result;
          if (
            result.outputs &&
            Array.isArray(result.outputs) &&
            result.outputs.length > 0
          ) {
            const videoUrl = result.outputs[0].url;
            if (videoUrl) {
              params = { ...params, video: videoUrl };
              console.log(
                `[Orchestrator] Resolved video dependency ${videoJobId} to URL: ${videoUrl}`,
              );
            } else {
              throw new Error(`Video job ${videoJobId} output has no URL`);
            }
          } else {
            console.error(
              `[Orchestrator] Video job ${videoJobId} has invalid result format:`,
              videoJob.result,
            );
            throw new Error(
              `Video job ${videoJobId} did not produce a valid video URL`,
            );
          }
        } else {
          console.error(
            `[Orchestrator] Video job ${videoJobId} not found or has no result`,
          );
          throw new Error(`Video job dependency ${videoJobId} not found`);
        }
      }
    }

    // Resolve transcript job dependencies in params
    if (params.transcript && typeof params.transcript === "string") {
      const transcriptDepMarker = params.transcript as string;
      if (transcriptDepMarker.startsWith("_transcriptJobDependency:")) {
        const transcriptJobId = transcriptDepMarker.replace(
          "_transcriptJobDependency:",
          "",
        );
        const transcriptJob = allJobs.find((j) => j.jobId === transcriptJobId);

        if (transcriptJob?.result) {
          const result = transcriptJob.result;
          // Transcript job returns a JSON file URL
          // Try outputs array first, then fall back to direct url
          if (
            result.outputs &&
            Array.isArray(result.outputs) &&
            result.outputs.length > 0
          ) {
            const transcriptUrl = result.outputs[0].url;
            if (transcriptUrl) {
              params = { ...params, transcript: transcriptUrl };
              console.log(
                `[Orchestrator] Resolved transcript dependency ${transcriptJobId} to URL: ${transcriptUrl}`,
              );
            } else {
              throw new Error(
                `Transcript job ${transcriptJobId} output has no URL`,
              );
            }
          } else if (result.url) {
            params = { ...params, transcript: result.url };
            console.log(
              `[Orchestrator] Resolved transcript dependency ${transcriptJobId} to URL: ${result.url}`,
            );
          } else {
            console.error(
              `[Orchestrator] Transcript job ${transcriptJobId} has invalid result format:`,
              transcriptJob.result,
            );
            throw new Error(
              `Transcript job ${transcriptJobId} output has no URL`,
            );
          }
        } else {
          console.error(
            `[Orchestrator] Transcript job ${transcriptJobId} not found or has no result`,
          );
          throw new Error(
            `Transcript job dependency ${transcriptJobId} not found`,
          );
        }
      }
    }

    // Resolve background job dependencies in params (can be string or array)
    if (params.background) {
      const backgrounds = Array.isArray(params.background)
        ? params.background
        : [params.background];
      const resolvedBackgrounds: string[] = [];

      for (const bg of backgrounds) {
        if (typeof bg === "string" && bg.startsWith("_imageJobDependency:")) {
          const bgJobId = bg.replace("_imageJobDependency:", "");
          const bgJob = allJobs.find((j) => j.jobId === bgJobId);

          if (bgJob?.result) {
            const result = bgJob.result;
            if (
              result.outputs &&
              Array.isArray(result.outputs) &&
              result.outputs.length > 0
            ) {
              const bgUrl = result.outputs[0].url;
              if (bgUrl) {
                resolvedBackgrounds.push(bgUrl);
                console.log(
                  `[Orchestrator] Resolved background dependency ${bgJobId} to URL: ${bgUrl}`,
                );
              } else {
                throw new Error(`Background job ${bgJobId} output has no URL`);
              }
            } else {
              console.error(
                `[Orchestrator] Background job ${bgJobId} has invalid result format:`,
                bgJob.result,
              );
              throw new Error(
                `Background job ${bgJobId} did not produce a valid image URL`,
              );
            }
          } else {
            console.error(
              `[Orchestrator] Background job ${bgJobId} not found or has no result`,
            );
            throw new Error(`Background job dependency ${bgJobId} not found`);
          }
        } else {
          // Not a dependency reference, use as-is
          resolvedBackgrounds.push(bg as string);
        }
      }

      // Update params with resolved backgrounds (preserve single value if input was single)
      params = {
        ...params,
        background: Array.isArray(params.background)
          ? resolvedBackgrounds
          : resolvedBackgrounds[0],
      };
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

      let executionResult = null;
      let executionError = null;

      if (hasFailures) {
        // Find root cause failures (jobs that failed due to actual errors, not dependencies)
        const rootFailures = allJobs.filter(
          (j) => j.status === "failed" && j.error !== "Dependency job failed",
        );

        if (rootFailures.length === 1) {
          // Single failure - simple message
          const failure = rootFailures[0];
          executionError = `Job '${failure?.operation}' failed: ${failure?.error}`;
        } else if (rootFailures.length > 1) {
          // Multiple failures - list them
          const failureMessages = rootFailures
            .map((j) => `${j.operation} (${j.error})`)
            .join(", ");
          executionError = `${rootFailures.length} jobs failed: ${failureMessages}`;
        } else {
          // All failures are dependency failures
          executionError = "Execution failed due to dependency errors";
        }
      } else {
        // Success - find the last job result
        const lastJob = findLastExecutedJob(allJobs);
        const jobResult = lastJob?.result;

        // Transform parser result format to flat MediaResult for SDK
        // New format: { status: "completed", outputs: [{ type, url, mimeType }] }
        // Old format: { status: "completed", output: { url: "..." } }
        // SDK expects: { url: "...", status: "completed" }
        if (jobResult && typeof jobResult === "object") {
          // Handle new outputs array format (preferred)
          if (
            "outputs" in jobResult &&
            Array.isArray(jobResult.outputs) &&
            jobResult.outputs.length > 0
          ) {
            const firstOutput = jobResult.outputs[0];
            if (
              firstOutput &&
              typeof firstOutput === "object" &&
              "url" in firstOutput
            ) {
              executionResult = {
                url: firstOutput.url,
                status: "completed",
              };
            } else {
              executionResult = jobResult;
            }
          }
          // Handle old output object format (backward compatibility)
          else if (
            "output" in jobResult &&
            jobResult.output &&
            typeof jobResult.output === "object" &&
            "url" in jobResult.output
          ) {
            executionResult = {
              url: (jobResult.output as any).url,
              status: "completed",
            };
          }
          // No recognized format, return as-is
          else {
            executionResult = jobResult;
          }
        } else {
          executionResult = jobResult || null;
        }
      }

      await db
        .update(executions)
        .set({
          status: hasFailures ? "failed" : "completed",
          result: executionResult,
          error: executionError,
          completedAt: new Date(),
        })
        .where(eq(executions.id, executionId));

      // Emit webhook delivery job if execution has a webhook URL
      if (execution.webhook) {
        console.log(
          `[ExecutionOrchestrator] Emitting webhook delivery job for execution ${executionId}`,
        );
        await this.jobClient.emit("webhook-delivery", { executionId });
      }
    }
  }
}

/**
 * Find the last executed job in a pipeline
 * Returns the leaf node job (job that no other job depends on) with the latest completedAt timestamp
 */
function findLastExecutedJob(jobs: any[]): any | null {
  if (jobs.length === 0) return null;

  // Find all job IDs that are dependencies of other jobs
  const jobsWithDependents = new Set(
    jobs.flatMap((j) => (j.dependencies || []) as string[]),
  );

  // Find leaf jobs (jobs that no other job depends on) that are completed
  const leafJobs = jobs.filter(
    (j) => !jobsWithDependents.has(j.jobId) && j.status === "completed",
  );

  if (leafJobs.length === 0) return null;

  // If multiple leaf jobs, return the one with latest completedAt
  return (
    leafJobs.sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })[0] || null
  );
}

let orchestratorInstance: ExecutionOrchestrator | null = null;

export const getOrchestrator = async (): Promise<ExecutionOrchestrator> => {
  if (!orchestratorInstance) {
    orchestratorInstance = new ExecutionOrchestrator();
    await orchestratorInstance.start();
  }
  return orchestratorInstance;
};
