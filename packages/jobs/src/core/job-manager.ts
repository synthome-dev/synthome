import PgBoss from "pg-boss";
import type { Job, JobOptions } from "./types";
import { BaseJob } from "./base-job";

export class JobManager {
  private readonly boss: PgBoss;
  private jobs = new Map<string, Job<any>>();
  private started = false;

  constructor(connectionString?: string) {
    const connString = connectionString || process.env.DATABASE_URL;
    if (!connString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    this.boss = new PgBoss({
      connectionString: connString,
      schema: "pgboss",
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      expireInHours: 24,
      archiveCompletedAfterSeconds: 900, // 15 minutes
      deleteAfterDays: 7,
      monitorStateIntervalSeconds: 30,
      maintenanceIntervalSeconds: 120,
    });

    this.boss.on("error", (error: Error) => {
      console.error("[JobManager] PgBoss error:", error);
    });

    // this.boss.on("monitor-states", (states: any) => {
    //   console.log("[JobManager] Monitor states:", states);
    // });
  }

  /**
   * Register a job class
   */
  register<T extends Job<any>>(JobClass: new (boss: PgBoss) => T): this {
    const job = new JobClass(this.boss);
    this.jobs.set(job.type, job);
    console.log(`[JobManager] Registered job: ${job.type}`);
    return this;
  }

  /**
   * Start the job manager and all registered jobs
   */
  async start(): Promise<void> {
    if (this.started) {
      console.log("[JobManager] Already started");
      return;
    }

    await this.boss.start();
    console.log("[JobManager] PgBoss started successfully");

    // Start all registered jobs
    for (const job of this.jobs.values()) {
      await job.start();
      console.log(`[JobManager] Started job: ${job.type}`);
    }

    this.started = true;
    console.log("[JobManager] All jobs started successfully");
  }

  /**
   * Stop the job manager
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    await this.boss.stop();
    this.started = false;
    console.log("[JobManager] Stopped successfully");
  }

  /**
   * Emit a job with type-safe data
   */
  async emit(
    jobName: string,
    data: any,
    options?: Partial<JobOptions>,
  ): Promise<string> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(
        `Job ${jobName} not registered. Please register it first.`,
      );
    }

    return await job.emit(data, options);
  }

  /**
   * Emit a job with dependencies
   */
  async emitWithDependencies(
    jobName: string,
    data: any,
    dependencies: string[],
    options?: Partial<JobOptions>,
  ): Promise<string> {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(
        `Job ${jobName} not registered. Please register it first.`,
      );
    }

    // Use BaseJob's emitWithDependencies if available
    if (job instanceof BaseJob) {
      return await job.emitWithDependencies(data, dependencies, options);
    }

    // Fallback to regular emit with warning
    console.warn(
      `[JobManager] Job ${jobName} doesn't support dependencies, using regular emit`,
    );
    return await job.emit(data, options);
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string): Promise<PgBoss.Job | null> {
    return await this.boss.getJobById(jobId);
  }

  /**
   * Get multiple job statuses
   */
  async getJobStatuses(jobIds: string[]): Promise<(PgBoss.Job | null)[]> {
    return await Promise.all(jobIds.map((id) => this.boss.getJobById(id)));
  }

  /**
   * Get the underlying PgBoss instance
   */
  getBoss(): PgBoss {
    return this.boss;
  }
}
