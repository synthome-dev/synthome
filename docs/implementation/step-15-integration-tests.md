# Step 15: Integration Tests

## Overview

Create end-to-end integration tests for the complete pipeline.

## Files to Create

- `apps/be/tests/integration/execute.test.ts`
- `packages/jobs/tests/integration/pipeline.test.ts`

## API Integration Tests

### tests/integration/execute.test.ts

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import app from "../../src/index";
import { db } from "@repo/db";
import { executions, executionJobs } from "@repo/db/schema";

describe("Execute API", () => {
  beforeAll(async () => {
    await db.delete(executions);
    await db.delete(executionJobs);
  });

  test("creates execution and returns ID", async () => {
    const res = await app.request("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionPlan: {
          jobs: [
            {
              id: "test-job",
              operation: "generateVideo",
              params: { prompt: "test" },
            },
          ],
          rootJobIds: ["test-job"],
        },
      }),
    });

    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.status).toBe("pending");
  });

  test("returns status for execution", async () => {
    const createRes = await app.request("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionPlan: {
          jobs: [],
          rootJobIds: [],
        },
      }),
    });

    const { id } = await createRes.json();

    const statusRes = await app.request(`/api/execute/${id}/status`);
    expect(statusRes.status).toBe(200);

    const status = await statusRes.json();
    expect(status.id).toBe(id);
    expect(status.status).toBe("pending");
  });

  test("validates execution plan", async () => {
    const res = await app.request("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionPlan: {
          jobs: "invalid",
        },
      }),
    });

    expect(res.status).toBe(400);
  });
});
```

## Pipeline Integration Tests

### tests/integration/pipeline.test.ts

```typescript
import { describe, test, expect } from "bun:test";
import { compose, generateVideo } from "@repo/ai-video-sdk";

describe("Pipeline Execution", () => {
  test("executes simple video generation", async () => {
    const pipeline = compose().generateVideo({
      provider: "replicate",
      model: "test-model",
      prompt: "test video",
    });

    const execution = await pipeline.execute();

    expect(execution.id).toBeDefined();
    expect(execution.status).toBe("pending");
  });

  test("executes pipeline with dependencies", async () => {
    const pipeline = compose()
      .generateVideo({
        provider: "replicate",
        model: "test-model",
        prompt: "base video",
      })
      .addSubtitles({
        text: "Hello world",
      });

    const execution = await pipeline.execute();

    await execution.onComplete();

    const status = await fetch(
      `http://localhost:3000/api/execute/${execution.id}/status`,
    ).then((r) => r.json());

    expect(status.jobs).toHaveLength(2);
    expect(status.jobs[1].operation).toBe("addSubtitles");
  });
});
```

## Completion Criteria

- [ ] API tests pass
- [ ] Pipeline tests pass
- [ ] Tests cover happy path
- [ ] Tests cover error cases
