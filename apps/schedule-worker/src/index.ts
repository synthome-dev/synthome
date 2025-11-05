import { GenerateVideoJob, JobManager, MergeVideosJob } from "@repo/jobs";
import "dotenv/config";
import { PollingWorker } from "./polling-worker";

const jobManager = new JobManager();
jobManager.register(GenerateVideoJob);
jobManager.register(MergeVideosJob);

const pollingWorker = new PollingWorker({
  intervalMs: 10000, // Check every 10 seconds
  maxPollAttempts: 100,
  backoffMultiplier: 1.5,
  initialBackoffMs: 5000,
});

async function start() {
  try {
    await jobManager.start();
    console.log("✅ PGBoss job system started");

    await pollingWorker.start();
    console.log("✅ Polling worker started");
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
  await pollingWorker.stop();
  await jobManager.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  await pollingWorker.stop();
  await jobManager.stop();
  process.exit(0);
});
