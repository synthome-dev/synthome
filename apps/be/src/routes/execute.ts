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
import { providerKeyService } from "@repo/api-keys";

const executeRouter = new Hono();

// Apply middleware to all routes
executeRouter.use("/*", authMiddleware);
executeRouter.use("/*", rateLimitMiddleware);

executeRouter.post("/", async (c) => {
  try {
    const { executionPlan, options } = await c.req.json();
    const auth = getAuthContext(c);

    // Priority: Client-provided keys > Stored keys > Server env keys
    let providerApiKeys = options?.providerApiKeys || {};

    // Fetch stored keys from database
    const storedKeys = await providerKeyService.getProviderKeysForExecution(
      auth.organizationId,
    );

    // Merge: client keys override stored keys
    providerApiKeys = {
      ...storedKeys,
      ...providerApiKeys, // Client-provided keys take priority
    };

    const orchestrator = await getOrchestrator();
    const executionId = await orchestrator.createExecution(executionPlan, {
      ...options,
      organizationId: auth.organizationId,
      apiKeyId: auth.apiKeyId,
      providerApiKeys, // Merged keys
    });

    // Mark provider keys as used (fire and forget)
    if (providerApiKeys && Object.keys(providerApiKeys).length > 0) {
      for (const provider of Object.keys(providerApiKeys)) {
        providerKeyService
          .markProviderKeyUsed({
            organizationId: auth.organizationId,
            provider: provider as any,
          })
          .catch((err) =>
            console.error("Failed to mark provider key as used:", err),
          );
      }
    }

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

  // If execution error is null but there are failed jobs, construct error from jobs
  let executionError = execution.error;
  if (!executionError && execution.status === "failed") {
    const failedJobs = jobs.filter((j) => j.status === "failed" && j.error);
    if (failedJobs.length > 0) {
      executionError = failedJobs
        .map((j) => `${j.operation}: ${j.error}`)
        .join("; ");
    }
  }

  return c.json<ExecutionStatusResponse>({
    id: execution.id,
    status: execution.status as
      | "pending"
      | "processing"
      | "completed"
      | "failed",
    jobs: jobStatuses,
    result: (execution.result as any) || null,
    error: executionError,
    createdAt: execution.createdAt,
    completedAt: execution.completedAt,
  });
});

export { executeRouter };
