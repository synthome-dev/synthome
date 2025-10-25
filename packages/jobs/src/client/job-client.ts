import PgBoss from "pg-boss";

export interface OnboardingJobIds {
  metadata: string;
  template: string;
  planning: string;
  batch: string;
}

/**
 * JobClient is a lightweight client for emitting jobs without registering handlers.
 * This is intended for use in Next.js API routes and other job producers.
 */
export class JobClient {
  private boss: PgBoss;
  private started = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL;
    if (!connString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    this.boss = new PgBoss({
      connectionString: connString,
      schema: "pgboss",
      // Minimal configuration for job emission only
      noScheduling: true, // Don't run scheduling
      noSupervisor: true, // Don't run maintenance
    });
  }

  /**
   * Start the job client (required before emitting jobs)
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    await this.boss.start();
    this.started = true;
  }

  /**
   * Stop the job client
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }
    await this.boss.stop();
    this.started = false;
  }

  /**
   * Queue onboarding jobs with dependencies
   */
  async queueOnboardingJobs(
    campaignId: string,
    data: any,
  ): Promise<OnboardingJobIds> {
    if (!this.started) {
      throw new Error("JobClient must be started before emitting jobs");
    }

    // Queue only metadata job
    const metadataJobId = await this.boss.send("generate-campaign-metadata", {
      campaignId,
      description: data.description,
      videoType: data.videoType,
      videoStyle: data.videoStyle,
      frequency: data.frequency,
    });

    await this.boss.send("generate-first-batch", { campaignId });

    if (!metadataJobId) {
      throw new Error("Failed to queue metadata job");
    }

    // Return job IDs (only metadata, others are removed)
    return {
      metadata: metadataJobId,
      template: "",
      planning: "",
      batch: "", // Will be queued by metadata job completion
    };
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<PgBoss.Job | null> {
    if (!this.started) {
      throw new Error("JobClient must be started before querying jobs");
    }
    return await this.boss.getJobById(jobId);
  }

  /**
   * Get multiple job statuses
   */
  async getJobStatuses(jobIds: string[]): Promise<(PgBoss.Job | null)[]> {
    if (!this.started) {
      throw new Error("JobClient must be started before querying jobs");
    }
    return await Promise.all(jobIds.map((id) => this.boss.getJobById(id)));
  }

  /**
   * Emit a generic job
   */
  async emit(
    jobName: string,
    data: any,
    options?: PgBoss.SendOptions,
  ): Promise<string> {
    if (!this.started) {
      throw new Error("JobClient must be started before emitting jobs");
    }
    const jobId = await this.boss.send(jobName, data, options || {});
    if (!jobId) {
      throw new Error(`Failed to queue job ${jobName}`);
    }
    return jobId;
  }
}
