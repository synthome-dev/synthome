import type PgBoss from "pg-boss";
import type { Job, JobOptions } from "./types";

export abstract class BaseJob<T extends object> implements Job<T> {
  protected boss: PgBoss;
  abstract readonly type: string;
  readonly options: JobOptions = {
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInHours: 24,
  };

  constructor(boss: PgBoss) {
    this.boss = boss;
  }

  async start(): Promise<void> {
    await this.boss.work(
      this.type,
      { teamSize: 5, teamConcurrency: 5 },
      this.work.bind(this),
    );
  }

  abstract work(job: PgBoss.Job<T>): Promise<void>;

  async emit(data: T, options?: Partial<JobOptions>): Promise<string> {
    const jobId = await this.boss.send(this.type, data, {
      ...this.options,
      ...options,
    });

    if (!jobId) {
      throw new Error(`Failed to queue job ${this.type}`);
    }

    return jobId;
  }

  async emitWithDependencies(
    data: T,
    dependencies: string[],
    options?: Partial<JobOptions>,
  ): Promise<string> {
    const wrapperJobName = `${this.type}-after-deps`;

    // Register the wrapper handler if not already registered
    await this.boss.work(
      wrapperJobName,
      { teamSize: 5, teamConcurrency: 5 },
      async (job: PgBoss.Job<any>) => {
        const { originalData, dependencyIds } = job.data;

        // Wait for all dependencies to complete
        console.log(
          `[Jobs] Waiting for dependencies: ${dependencyIds.join(", ")}`,
        );

        for (const depId of dependencyIds) {
          let completed = false;
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes with 5 second intervals

          while (!completed && attempts < maxAttempts) {
            const depJob = await this.boss.getJobById(depId);

            if (!depJob) {
              throw new Error(`Dependency job ${depId} not found`);
            }

            if (depJob.state === "completed") {
              completed = true;
            } else if (depJob.state === "failed") {
              throw new Error(`Dependency job ${depId} failed`);
            } else {
              // Wait 5 seconds before checking again
              await new Promise((resolve) => setTimeout(resolve, 5000));
              attempts++;
            }
          }

          if (!completed) {
            throw new Error(`Timeout waiting for dependency job ${depId}`);
          }
        }

        console.log(`[Jobs] All dependencies completed, running ${this.type}`);

        // Now run the actual job
        await this.work({ ...job, data: originalData });
      },
    );

    // Queue the wrapper job
    const jobId = await this.boss.send(
      wrapperJobName,
      {
        originalData: data,
        dependencyIds: dependencies,
      },
      {
        ...this.options,
        ...options,
      },
    );

    if (!jobId) {
      throw new Error(`Failed to queue job ${this.type} with dependencies`);
    }

    return jobId;
  }
}
