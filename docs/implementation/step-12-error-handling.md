# Step 12: Error Handling & Recovery

## Overview

Implement comprehensive error handling, retry logic, and execution recovery mechanisms.

## Files to Create/Modify

- `apps/be/src/middleware/error-handler.ts` (new)
- `packages/jobs/src/core/base-job.ts` (modify)
- `apps/be/src/services/execution-orchestrator.ts` (modify)

## Error Handler Middleware

### middleware/error-handler.ts

```typescript
import { Context } from "hono";

export async function errorHandler(c: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (error) {
    console.error("Request error:", error);

    if (error instanceof ValidationError) {
      return c.json(
        {
          error: "Validation failed",
          details: error.details,
        },
        400,
      );
    }

    if (error instanceof NotFoundError) {
      return c.json(
        {
          error: error.message,
        },
        404,
      );
    }

    if (error instanceof ExecutionError) {
      return c.json(
        {
          error: "Execution failed",
          details: error.message,
        },
        500,
      );
    }

    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  }
}

export class ValidationError extends Error {
  constructor(public details: any) {
    super("Validation error");
  }
}

export class NotFoundError extends Error {}
export class ExecutionError extends Error {}
```

## Enhanced Base Job

### core/base-job.ts

```typescript
export abstract class BaseJob<T = any> {
  protected maxRetries = 3;
  protected retryDelay = 5000;

  async executeWithRetry(data: T): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.execute(data);
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.log(
            `Job failed attempt ${attempt + 1}, retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  protected async withTimeout<R>(
    promise: Promise<R>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<R> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([promise, timeout]);
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  abstract execute(data: T): Promise<void>;
}
```

## Completion Criteria

- [ ] Error handler middleware added
- [ ] Base job has retry logic
- [ ] Jobs registered with retry config
- [ ] Recovery endpoint works
- [ ] Failed jobs can be retried
