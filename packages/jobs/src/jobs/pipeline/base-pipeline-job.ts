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
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));
  }

  protected async failJob(jobRecordId: string, error: string): Promise<void> {
    await db
      .update(executionJobs)
      .set({
        status: "failed",
        error,
        completedAt: new Date(),
      })
      .where(eq(executionJobs.id, jobRecordId));
  }
}
