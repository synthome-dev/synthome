import { Hono } from "hono";
import { adminRouter } from "./routes/admin";
import { clerkWebhooksRouter } from "./routes/clerk-webhooks";
import { executeRouter } from "./routes/execute";
import { testRouter } from "./routes/test";
import { webhooksRouter } from "./routes/webhooks";
import { getOrchestrator } from "./services/execution-orchestrator";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Register production routes
app.route("/api/execute", executeRouter);
app.route("/api/webhooks", webhooksRouter);
app.route("/api/clerk-webhooks", clerkWebhooksRouter);
app.route("/api/admin", adminRouter);

// Register development-only routes
const isDevelopment = Bun.env.NODE_ENV === "development" || !Bun.env.NODE_ENV;

if (isDevelopment) {
  console.log("🔧 Development mode: Registering test and debug endpoints");

  // Debug endpoint to manually trigger dependent jobs check
  app.post("/api/debug/check-dependent-jobs/:executionId/:jobId", async (c) => {
    const executionId = c.req.param("executionId");
    const jobId = c.req.param("jobId");

    try {
      const orchestrator = await getOrchestrator();
      await orchestrator.checkAndEmitDependentJobs(executionId, jobId);
      return c.json({
        success: true,
        message: "Checked and emitted dependent jobs",
      });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500,
      );
    }
  });

  app.route("/api/test", testRouter);
}

export default {
  port: Bun.env.PORT ? parseInt(Bun.env.PORT) : 3100,
  hostname: "::", // Listen on IPv6 (and IPv4 via dual-stack) for Railway private networking
  fetch: app.fetch,
  idleTimeout: 255, // Maximum timeout allowed by Bun (255 seconds ~4.25 minutes)
};
