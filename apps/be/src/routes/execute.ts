import { Hono } from "hono";
import { getOrchestrator } from "../services/execution-orchestrator";
import { db, executions, executionJobs, eq } from "@repo/db";
import {
  authMiddleware,
  rateLimitMiddleware,
  getAuthContext,
} from "../middleware";
import type {
  ExecuteResponse,
  ExecutionStatusResponse,
  ErrorResponse,
} from "@repo/api-types";

const executeRouter = new Hono();

// Apply middleware to all routes
executeRouter.use("/*", authMiddleware);
executeRouter.use("/*", rateLimitMiddleware);

executeRouter.post("/", async (c) => {
  try {
    const { executionPlan, options } = await c.req.json();
    const auth = getAuthContext(c);

    const orchestrator = await getOrchestrator();
    const executionId = await orchestrator.createExecution(executionPlan, {
      ...options,
      organizationId: auth.organizationId,
      apiKeyId: auth.apiKeyId,
      providerApiKeys: options?.providerApiKeys, // Pass client's provider API keys
    });

    return c.json<ExecuteResponse>(
      {
        executionId,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      202,
    );
  } catch (error) {
    console.error("[ExecuteRouter] Error creating execution:", error);
    return c.json<ErrorResponse>(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      500,
    );
  }
});

executeRouter.get("/:id/status", async (c) => {
  const executionId = c.req.param("id");

  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);

  if (!execution) {
    return c.json<ErrorResponse>({ error: "Execution not found" }, 404);
  }

  const jobs = await db
    .select()
    .from(executionJobs)
    .where(eq(executionJobs.executionId, executionId));

  const jobStatuses = jobs.map((j) => ({
    id: j.jobId,
    operation: j.operation,
    status: j.status,
    result: j.result,
    error: j.error,
  }));

  return c.json<ExecutionStatusResponse>({
    id: execution.id,
    status: execution.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed",
    jobs: jobStatuses,
    result: (execution.result as any) || null,
    error: execution.error,
    createdAt: execution.createdAt,
    completedAt: execution.completedAt,
  });
});

export { executeRouter };
