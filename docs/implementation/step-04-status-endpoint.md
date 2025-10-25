# Step 4: Status Endpoint

## Overview

Create GET /api/execute/:id/status endpoint for polling execution status.

## Files to Modify

- `apps/be/src/routes/execute.ts`

## Implementation

```typescript
import { eq } from "drizzle-orm";

executeRouter.get("/:id/status", async (c) => {
  const executionId = c.req.param("id");

  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);

  if (!execution) {
    return c.json({ error: "Execution not found" }, 404);
  }

  // Get job statuses
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

  return c.json({
    id: execution.id,
    status: execution.status,
    jobs: jobStatuses,
    result: execution.result,
    error: execution.error,
    createdAt: execution.createdAt,
    completedAt: execution.completedAt,
  });
});
```

## Response Format

```typescript
{
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  jobs: Array<{
    id: string;
    operation: string;
    status: string;
    result?: any;
    error?: string;
  }>;
  result?: {
    url: string;
    outputs: Record<string, any>;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}
```

## Testing

```bash
# Create execution
EXEC_ID=$(curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"executionPlan":{"jobs":[],"rootJobIds":[]}}' \
  | jq -r '.id')

# Check status
curl http://localhost:3000/api/execute/$EXEC_ID/status | jq
```

## Completion Criteria

- [ ] Status endpoint returns execution details
- [ ] Includes all job statuses
- [ ] Returns 404 for missing executions
- [ ] Response matches SDK expectations
