import { resetMonthlyUsage } from "@repo/db";
import {
  GenerateAudioJob,
  GenerateImageJob,
  GenerateVideoJob,
  JobManager,
  MergeVideosJob,
  RemoveBackgroundJob,
  RemoveImageBackgroundJob,
  ReplaceGreenScreenJob,
  WebhookDeliveryJob,
} from "@repo/jobs";
import { Scheduler } from "@repo/scheduler";
import "dotenv/config";
import { PollingWorker } from "./polling-worker";

const jobManager = new JobManager();
jobManager.register(GenerateVideoJob);
jobManager.register(GenerateImageJob);
jobManager.register(GenerateAudioJob);
jobManager.register(MergeVideosJob);
jobManager.register(RemoveBackgroundJob);
jobManager.register(ReplaceGreenScreenJob);
jobManager.register(RemoveImageBackgroundJob);
jobManager.register(WebhookDeliveryJob);

const pollingWorker = new PollingWorker({
  intervalMs: 10000, // Check every 10 seconds
  maxPollAttempts: 100,
  backoffMultiplier: 2,
  initialBackoffMs: 5000,
});

// Set up monthly usage reset scheduler
const scheduler = new Scheduler({ timezone: "UTC" });
scheduler.register({
  id: "monthly-usage-reset",
  name: "Monthly Usage Reset",
  cronExpression: "0 0 1 * *", // Run at midnight on the 1st of every month
  enabled: true,
  handler: async () => {
    console.log("[Scheduler] Running monthly usage reset...");
    const result = await resetMonthlyUsage();
    console.log(
      `[Scheduler] Monthly usage reset completed: ${result.resetCount} organizations reset, ${result.errors.length} errors`,
    );
    if (result.errors.length > 0) {
      console.error("[Scheduler] Errors during reset:", result.errors);
    }
  },
});

async function start() {
  try {
    await jobManager.start();
    console.log("✅ PGBoss job system started");

    await pollingWorker.start();
    console.log("✅ Polling worker started");

    console.log("✅ Monthly usage reset scheduler registered");
  } catch (error) {
    console.error("❌ Failed to start workers:", error);
    process.exit(1);
  }
}

console.log("📅 Starting Schedule Worker...");
console.log("✅ Schedule Worker is running");

start();

process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  scheduler.stopAll();
  await pollingWorker.stop();
  await jobManager.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  scheduler.stopAll();
  await pollingWorker.stop();
  await jobManager.stop();
  process.exit(0);
});
