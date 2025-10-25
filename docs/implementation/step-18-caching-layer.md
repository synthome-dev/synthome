# Step 18: Caching Layer

## Overview

Implement caching for video generation results to avoid duplicate processing.

## Files to Create

- `packages/jobs/src/utils/cache.ts`
- `apps/be/src/services/result-cache.ts`

## Cache Implementation

### utils/cache.ts

```typescript
import { Redis } from "ioredis";

export class Cache {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
}

export const cache = new Cache();
```

## Result Cache Service

### services/result-cache.ts

```typescript
import { cache } from "@repo/jobs/cache";
import crypto from "crypto";

export class ResultCache {
  private static TTL = 7 * 24 * 60 * 60; // 7 days

  static generateKey(operation: string, params: any): string {
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ operation, params }))
      .digest("hex");

    return `result:${operation}:${hash}`;
  }

  static async get(operation: string, params: any): Promise<any | null> {
    const key = this.generateKey(operation, params);
    return await cache.get(key);
  }

  static async set(operation: string, params: any, result: any): Promise<void> {
    const key = this.generateKey(operation, params);
    await cache.set(key, result, this.TTL);
  }

  static async invalidate(operation: string, params: any): Promise<void> {
    const key = this.generateKey(operation, params);
    await cache.delete(key);
  }
}
```

## Update GenerateVideoJob

```typescript
import { ResultCache } from "@repo/be/result-cache";

export class GenerateVideoJob extends BaseJob<GenerateVideoParams> {
  async execute(data: GenerateVideoParams): Promise<void> {
    const cacheKey = { operation: "generateVideo", ...data.params };

    const cached = await ResultCache.get("generateVideo", cacheKey);
    if (cached) {
      this.logger.info("Using cached result");
      await this.saveResult(data.jobId, cached.url, cached.metadata);
      await this.updateJobStatus("completed");
      return;
    }

    await this.updateJobStatus("in_progress");

    try {
      const provider = ProviderFactory.getProvider(data.provider);
      const result = await provider.generateVideo(data.model, data.params);

      const s3Url = await this.uploadVideo(
        result.url,
        data.executionId,
        data.jobId,
      );

      await ResultCache.set("generateVideo", cacheKey, {
        url: s3Url,
        metadata: result.metadata,
      });

      await this.saveResult(data.jobId, s3Url, result.metadata);
      await this.updateJobStatus("completed");
    } catch (error) {
      await this.updateJobStatus("failed", error);
      throw error;
    }
  }
}
```

## Cache Invalidation

```typescript
executeRouter.delete("/:id/cache", async (c) => {
  const executionId = c.req.param("id");

  const [execution] = await db
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);

  const plan = execution.executionPlan as any;

  for (const job of plan.jobs) {
    await ResultCache.invalidate(job.operation, job.params);
  }

  return c.json({ message: "Cache invalidated" });
});
```

## Completion Criteria

- [ ] Redis cache implemented
- [ ] Result cache service created
- [ ] Jobs check cache before processing
- [ ] Cache invalidation endpoint works
- [ ] TTL configured appropriately
