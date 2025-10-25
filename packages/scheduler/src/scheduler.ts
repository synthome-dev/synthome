import * as cron from "node-cron";
import type { ScheduledJob, SchedulerOptions } from "./types";

export class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private options: SchedulerOptions;

  constructor(options: SchedulerOptions = {}) {
    this.options = {
      timezone: options.timezone || "UTC",
      runOnInit: options.runOnInit || false,
    };
  }

  register(job: ScheduledJob): void {
    if (this.jobs.has(job.id)) {
      throw new Error(`Job with id ${job.id} already exists`);
    }

    const task = cron.schedule(
      job.cronExpression,
      async () => {
        // console.log(`[Scheduler] Running job: ${job.name}`);
        const startTime = Date.now();

        try {
          await job.handler();
          // console.log(
          //   `[Scheduler] Job ${job.name} completed in ${Date.now() - startTime}ms`
          // );
        } catch (error) {
          console.error(`[Scheduler] Job ${job.name} failed:`, error);
        }
      },
      {
        scheduled: job.enabled !== false,
        timezone: this.options.timezone,
        runOnInit: this.options.runOnInit,
      }
    );

    this.jobs.set(job.id, task);
  }

  start(jobId: string): void {
    const task = this.jobs.get(jobId);
    if (!task) {
      throw new Error(`Job with id ${jobId} not found`);
    }
    task.start();
    console.log(`[Scheduler] Started job: ${jobId}`);
  }

  stop(jobId: string): void {
    const task = this.jobs.get(jobId);
    if (!task) {
      throw new Error(`Job with id ${jobId} not found`);
    }
    task.stop();
    console.log(`[Scheduler] Stopped job: ${jobId}`);
  }

  stopAll(): void {
    this.jobs.forEach((task, jobId) => {
      task.stop();
      console.log(`[Scheduler] Stopped job: ${jobId}`);
    });
  }

  remove(jobId: string): void {
    const task = this.jobs.get(jobId);
    if (task) {
      task.stop();
      this.jobs.delete(jobId);
      console.log(`[Scheduler] Removed job: ${jobId}`);
    }
  }

  getJob(jobId: string): cron.ScheduledTask | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}
