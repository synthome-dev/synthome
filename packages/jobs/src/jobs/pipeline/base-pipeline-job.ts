import type PgBoss from "pg-boss";
import { BaseJob } from "../../core/base-job";
import { db, executionJobs, eq } from "@repo/db";

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

    // Update job as completed
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));

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
