# Step 13: Input Validation

## Overview

Add request validation using Zod schemas to ensure data integrity.

## Files to Create/Modify

- `apps/be/src/schemas/execution.ts` (new)
- `apps/be/src/routes/execute.ts` (modify)

## Validation Schemas

### schemas/execution.ts

```typescript
import { z } from "zod";

export const jobSchema = z.object({
  id: z.string(),
  operation: z.enum([
    "generateVideo",
    "merge",
    "reframe",
    "lipSync",
    "addSubtitles",
  ]),
  params: z.record(z.any()),
  dependsOn: z.array(z.string()).optional(),
});

export const executionPlanSchema = z.object({
  jobs: z.array(jobSchema),
  rootJobIds: z.array(z.string()),
  baseExecutionId: z.string().optional(),
});

export const executeRequestSchema = z.object({
  executionPlan: executionPlanSchema,
  options: z
    .object({
      baseExecutionId: z.string().optional(),
      webhookUrl: z.string().url().optional(),
      webhookSecret: z.string().optional(),
    })
    .optional(),
});
```

## Update Execute Route

```typescript
import { executeRequestSchema } from "../schemas/execution";
import { ValidationError } from "../middleware/error-handler";

executeRouter.post("/", async (c) => {
  const body = await c.req.json();

  const validation = executeRequestSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError(validation.error.format());
  }

  const { executionPlan, options } = validation.data;

  const executionId = await executionOrchestrator.createExecution(
    executionPlan,
    options,
  );

  return c.json(
    {
      id: executionId,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    202,
  );
});
```

## Completion Criteria

- [ ] Zod schemas defined
- [ ] Validation applied to execute endpoint
- [ ] Returns 400 with details on validation error
