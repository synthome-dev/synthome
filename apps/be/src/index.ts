import { Hono } from "hono";
import { executeRouter } from "./routes/execute";
import { webhooksRouter } from "./routes/webhooks";
import { adminRouter } from "./routes/admin";
import { getOrchestrator } from "./services/execution-orchestrator";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

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

app.route("/api/execute", executeRouter);
app.route("/api/webhooks", webhooksRouter);
app.route("/api/admin", adminRouter);

export default {
  port: Bun.env.PORT ? parseInt(Bun.env.PORT) : 3100,
  fetch: app.fetch,
};
