# Step 19: Rate Limiting

## Overview

Implement rate limiting to protect API and provider quotas.

## Files to Create

- `apps/be/src/middleware/rate-limiter.ts`
- `packages/providers/src/rate-limiter.ts`

## API Rate Limiter

### middleware/rate-limiter.ts

```typescript
import { Context } from "hono";
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function rateLimiter(c: Context, next: () => Promise<void>) {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  const key = `ratelimit:${ip}`;

  const limit = 100; // requests
  const window = 60; // seconds

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return c.json(
      {
        error: "Rate limit exceeded",
        retryAfter: await redis.ttl(key),
      },
      429,
    );
  }

  c.header("X-RateLimit-Limit", limit.toString());
  c.header("X-RateLimit-Remaining", (limit - current).toString());

  await next();
}
```

## Provider Rate Limiter

### providers/src/rate-limiter.ts

```typescript
import { Redis } from "ioredis";

export class ProviderRateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  async checkLimit(provider: string, model: string): Promise<boolean> {
    const key = `provider:${provider}:${model}`;

    const limits: Record<string, { count: number; window: number }> = {
      replicate: { count: 50, window: 60 },
      fal: { count: 100, window: 60 },
      "google-cloud": { count: 30, window: 60 },
    };

    const limit = limits[provider] || { count: 10, window: 60 };

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, limit.window);
    }

    return current <= limit.count;
  }

  async wait(provider: string, model: string): Promise<void> {
    const key = `provider:${provider}:${model}`;
    const ttl = await this.redis.ttl(key);

    if (ttl > 0) {
      await this.sleep(ttl * 1000);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const providerRateLimiter = new ProviderRateLimiter();
```

## Update Providers

```typescript
import { providerRateLimiter } from "./rate-limiter";

export class ReplicateProvider extends BaseVideoProvider {
  async generateVideo(
    model: string,
    params: VideoGenerationParams,
  ): Promise<VideoGenerationResult> {
    const canProceed = await providerRateLimiter.checkLimit("replicate", model);

    if (!canProceed) {
      this.logger.warn("Rate limit hit, waiting...");
      await providerRateLimiter.wait("replicate", model);
    }

    return await this.client.run(model as any, { input: params });
  }
}
```

## Apply to API

```typescript
import { rateLimiter } from "./middleware/rate-limiter";

const app = new Hono();

app.use("*", rateLimiter);
app.route("/api/execute", executeRouter);
```

## Completion Criteria

- [ ] API rate limiter implemented
- [ ] Provider rate limiter implemented
- [ ] Redis stores rate limit counters
- [ ] Returns 429 when limit exceeded
- [ ] Different limits per provider
