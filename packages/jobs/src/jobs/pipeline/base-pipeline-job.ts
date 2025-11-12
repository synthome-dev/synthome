import type PgBoss from "pg-boss";
import { BaseJob } from "../../core/base-job";
import { db, executionJobs, executions, eq, logAction } from "@repo/db";

export interface PipelineJobData {
  executionId: string;
  jobRecordId: string;
  jobId: string;
  operation: string;
  params: Record<string, unknown>;
  dependencies: Record<string, any>;
}

export abstract class BasePipelineJob extends BaseJob<PipelineJobData> {
  abstract work(job: PgBoss.Job<PipelineJobData>): Promise<void>;

  /**
   * Fetches the execution record and provider API keys for a job
   * This is a reusable function used by all pipeline jobs to get access to client-provided provider API keys
   *
   * @param jobRecordId The ID of the job record
   * @returns The execution record with provider API keys
   * @throws Error if job record or execution is not found
   */
  protected async getExecutionWithProviderKeys(jobRecordId: string): Promise<{
    executionId: string;
    providerApiKeys?: {
      replicate?: string;
      fal?: string;
      "google-cloud"?: string;
    };
    organizationId?: string;
    apiKeyId?: string;
  }> {
    // Fetch job record
    const jobRecord = await db.query.executionJobs.findFirst({
      where: eq(executionJobs.id, jobRecordId),
    });

    if (!jobRecord) {
      throw new Error(`Job record ${jobRecordId} not found`);
    }

    // Fetch execution to get provider API keys
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, jobRecord.executionId),
    });

    if (!execution) {
      throw new Error(`Execution ${jobRecord.executionId} not found`);
    }

    return {
      executionId: execution.id,
      providerApiKeys: execution.providerApiKeys as any,
      organizationId: execution.organizationId ?? undefined,
      apiKeyId: execution.apiKeyId ?? undefined,
    };
  }

  protected async updateJobProgress(
    jobRecordId: string,
    stage: string,
    percentage: number,
  ): Promise<void> {
    await db
      .update(executionJobs)
      .set({
        progress: { stage, percentage },
      })
      .where(eq(executionJobs.id, jobRecordId));
  }

  protected async updateJobMetadata(
    jobRecordId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    const job = await db.query.executionJobs.findFirst({
      where: eq(executionJobs.id, jobRecordId),
    });

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    await db
      .update(executionJobs)
      .set({
        metadata: {
          ...((job.metadata as any) || {}),
          ...metadata,
        },
      })
      .where(eq(executionJobs.id, jobRecordId));
  }

  protected async completeJob(jobRecordId: string, result: any): Promise<void> {
    // Get job record to get executionId and jobId
    const job = await db.query.executionJobs.findFirst({
      where: eq(executionJobs.id, jobRecordId),
    });

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    // Get execution details for usage logging
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, job.executionId),
    });

    // Update job as completed
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));

    // Log usage if organization and API key are set, and action hasn't been logged yet
    if (
      execution?.organizationId &&
      execution?.apiKeyId &&
      job.organizationId &&
      !job.actionLogged
    ) {
      try {
        // Determine if this is overage
        const { checkIfOverage, calculateOverageCost } = await import(
          "@repo/db"
        );
        const isOverage = await checkIfOverage(execution.organizationId);
        const estimatedCost = isOverage
          ? await calculateOverageCost(execution.organizationId, 1)
          : null;

        // Log the action
        await logAction({
          organizationId: execution.organizationId,
          apiKeyId: execution.apiKeyId,
          actionType: job.operation,
          actionCount: 1,
          executionId: job.executionId,
          jobId: job.id,
          isOverage,
          estimatedCost: estimatedCost || undefined,
          metadata: {
            jobId: job.jobId,
            operation: job.operation,
          },
        });

        // Mark action as logged
        await db
          .update(executionJobs)
          .set({ actionLogged: true })
          .where(eq(executionJobs.id, jobRecordId));

        console.log(
          `[BasePipelineJob] Logged action for job ${job.jobId} (${job.operation}) - isOverage: ${isOverage}`,
        );
      } catch (error) {
        console.error(
          `[BasePipelineJob] Error logging action for job ${job.jobId}:`,
          error,
        );
        // Don't fail the job if usage logging fails
      }
    }

    // Trigger orchestrator to check execution completion and emit dependent jobs
    const { getOrchestrator } = await import(
      "../../orchestrator/execution-orchestrator"
    );
    const orchestrator = await getOrchestrator();
    await orchestrator.checkAndEmitDependentJobs(job.executionId, job.jobId);
  }

  protected async failJob(jobRecordId: string, error: string): Promise<void> {
    // Get job record to get executionId and jobId
    const job = await db.query.executionJobs.findFirst({
      where: eq(executionJobs.id, jobRecordId),
    });

    if (!job) {
      throw new Error(`Job ${jobRecordId} not found`);
    }

    // Update job as failed
    await db
      .update(executionJobs)
      .set({
        status: "failed",
        error,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));

    // Trigger orchestrator to check execution completion
    const { getOrchestrator } = await import(
      "../../orchestrator/execution-orchestrator"
    );
    const orchestrator = await getOrchestrator();
    await orchestrator.checkAndEmitDependentJobs(job.executionId, job.jobId);
  }
}
