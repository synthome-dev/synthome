import { GenerateVideoJob, MergeVideosJob, JobManager } from "@repo/jobs";
import "dotenv/config";

const jobManager = new JobManager();
jobManager.register(GenerateVideoJob);
jobManager.register(MergeVideosJob);

async function start() {
  try {
    await jobManager.start();
    console.log("✅ PGBoss job system started");
  } catch (error) {
    console.error("❌ Failed to start PGBoss job system:", error);
    process.exit(1);
  }
}

console.log("📅 Starting Schedule Worker...");
console.log("✅ Schedule Worker is running");

start();

process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  await jobManager.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  await jobManager.stop();
  process.exit(0);
});
