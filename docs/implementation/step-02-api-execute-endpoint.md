# Step 2: API Execute Endpoint

## Overview

Create the main POST /api/execute endpoint that accepts execution plans and returns execution IDs.

## Files to Create/Modify

- `apps/be/src/routes/execute.ts` (new)
- `apps/be/src/index.ts` (modify to add route)

## Endpoint Specification

### POST /api/execute

```typescript
// Request
{
  executionPlan: {
    jobs: Job[],
    rootJobIds: string[]
  },
  options?: {
    baseExecutionId?: string,
    webhookUrl?: string,
    webhookSecret?: string
  }
}

// Response 202 Accepted
{
  id: string,
  status: 'pending',
  createdAt: string
}
```

## Implementation

### routes/execute.ts

```typescript
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { db } from "@repo/db";
import { executions } from "@repo/db/schema";

const executeRouter = new Hono();

executeRouter.post("/", async (c) => {
  const { executionPlan, options } = await c.req.json();

  const executionId = nanoid();

  await db.insert(executions).values({
    id: executionId,
    status: "pending",
    executionPlan,
    baseExecutionId: options?.baseExecutionId,
    webhookUrl: options?.webhookUrl,
    webhookSecret: options?.webhookSecret,
  });

  // TODO: Create jobs (Step 3)

  return c.json(
    {
      id: executionId,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    202,
  );
});

export { executeRouter };
```

### index.ts

```typescript
import { Hono } from "hono";
import { executeRouter } from "./routes/execute";

const app = new Hono();

app.route("/api/execute", executeRouter);

export default app;
```

## Testing

```bash
# Start backend
cd apps/be && bun run dev

# Test endpoint
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "executionPlan": {
      "jobs": [],
      "rootJobIds": []
    }
  }'
```

## Completion Criteria

- [ ] Route created and mounted
- [ ] Creates execution record in database
- [ ] Returns 202 with execution ID
- [ ] Validates request body
