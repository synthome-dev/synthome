# Step 14: Monitoring & Logging

## Overview

Add structured logging and monitoring for production observability.

## Files to Create

- `apps/be/src/utils/logger.ts`
- `packages/jobs/src/utils/job-logger.ts`

## Logger Implementation

### utils/logger.ts

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

export function logRequest(c: Context) {
  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("user-agent"),
    },
    "Incoming request",
  );
}

export function logExecution(
  executionId: string,
  status: string,
  metadata?: any,
) {
  logger.info(
    {
      executionId,
      status,
      ...metadata,
    },
    "Execution status change",
  );
}
```

## Job Logger

### utils/job-logger.ts

```typescript
import { logger } from "@repo/logger";

export class JobLogger {
  constructor(
    private jobType: string,
    private jobId: string,
    private executionId: string,
  ) {}

  info(message: string, metadata?: any) {
    logger.info(
      {
        jobType: this.jobType,
        jobId: this.jobId,
        executionId: this.executionId,
        ...metadata,
      },
      message,
    );
  }

  error(message: string, error?: Error) {
    logger.error(
      {
        jobType: this.jobType,
        jobId: this.jobId,
        executionId: this.executionId,
        error: error?.message,
        stack: error?.stack,
      },
      message,
    );
  }

  timing(operation: string, durationMs: number) {
    logger.info(
      {
        jobType: this.jobType,
        jobId: this.jobId,
        executionId: this.executionId,
        operation,
        durationMs,
      },
      "Operation timing",
    );
  }
}
```

## Update Jobs

```typescript
export class GenerateVideoJob extends BaseJob<GenerateVideoParams> {
  private logger: JobLogger;

  async execute(data: GenerateVideoParams): Promise<void> {
    this.logger = new JobLogger("generate-video", data.jobId, data.executionId);

    this.logger.info("Starting video generation", {
      provider: data.provider,
      model: data.model,
    });

    const start = Date.now();

    try {
      await this.callProvider(data);
      this.logger.timing("provider-call", Date.now() - start);
      this.logger.info("Video generation completed");
    } catch (error) {
      this.logger.error("Video generation failed", error);
      throw error;
    }
  }
}
```

## Completion Criteria

- [ ] Pino logger configured
- [ ] Request logging added
- [ ] Job logging implemented
- [ ] Timing metrics tracked
