import { compose, generateVideo, replicate } from "../src/index.js";

const API_URL = "http://localhost:3100/api/execute";

console.log("=== Error Handling Examples ===\n");

// Example 1: Traditional try-catch (still works)
console.log("1. Traditional Try-Catch:");
async function traditionalErrorHandling() {
  try {
    const pipeline = compose(
      generateVideo({
        model: replicate("bytedance/seedance-1-pro"),
        prompt: "A skier glides over snow",
        duration: 5,
      })
    );

    await pipeline.execute({
      apiUrl: API_URL,
      // No API key - will fail with 401
    });
  } catch (error) {
    console.log("   ✓ Error caught in try-catch:", (error as Error).message);
  }
}

// Example 2: Event-driven error handling
console.log("\n2. Event-Driven Error Handling:");
async function eventDrivenErrorHandling() {
  const pipeline = compose(
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "A skier glides over snow",
      duration: 5,
    })
  )
    .onError((error) => {
      console.log("   ✓ Error handler called:", error.message);
      // Could log to monitoring service, show user notification, etc.
    })
    .onProgress((progress) => {
      console.log(`   Progress: ${progress.progress}%`);
    });

  try {
    await pipeline.execute({
      apiUrl: API_URL,
      // No API key - will fail with 401
    });
  } catch (error) {
    console.log("   ✓ Error still throws after callback");
  }
}

// Example 3: Graceful degradation
console.log("\n3. Graceful Degradation:");
async function gracefulDegradation() {
  let videoResult = null;

  const pipeline = compose(
    generateVideo({
      model: replicate("bytedance/seedance-1-pro"),
      prompt: "A skier glides over snow",
      duration: 5,
    })
  ).onError((error) => {
    console.log("   ⚠️  Video generation failed, using fallback:", error.message);
    // Could return a placeholder video or cached content
  });

  try {
    videoResult = await pipeline.execute({
      apiUrl: API_URL,
      // No API key
    });
  } catch (error) {
    console.log("   ℹ️  Using default placeholder video");
    videoResult = { url: "https://example.com/placeholder.mp4" };
  }

  console.log("   ✓ Application continues:", videoResult);
}

// Run all examples
(async () => {
  await traditionalErrorHandling();
  await eventDrivenErrorHandling();
  await gracefulDegradation();

  console.log("\n=== Summary ===");
  console.log("✓ Developers can choose their error handling strategy:");
  console.log("  1. Traditional try-catch (default behavior)");
  console.log("  2. Event-driven with onError() callback");
  console.log("  3. Mix both for logging + handling");
})();
