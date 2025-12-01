# Best Practices for Building Reliable AI Pipelines in Production

Building AI pipelines that work in demos is easy. Building ones that survive production is hard. This guide covers the battle-tested patterns for retry logic, rate limiting, versioning, error isolation, and observability that keep AI pipelines running when things go wrong.

---

## Why Production AI Pipelines Break

AI pipelines fail in ways traditional APIs don't:

- **Transient failures**: Providers go down for seconds
- **Rate limits**: Hit unexpectedly during traffic spikes
- **Model changes**: Providers update models, breaking your code
- **Async timeouts**: Jobs hang indefinitely
- **Partial failures**: Step 3 of 5 fails, but steps 1-2 cost money
- **Silent failures**: Model returns garbage, not errors

**The cost:** Every failure wastes API credits and user trust.

## 1. Retry Logic (The Right Way)

Not all failures should retry. Some should fail fast.

### Identify Retryable vs. Permanent Errors

```typescript
interface ErrorClassification {
  retryable: boolean;
  backoff: "immediate" | "exponential" | "none";
  maxRetries: number;
}

function classifyError(error: any): ErrorClassification {
  // Rate limits → retry with backoff
  if (error.status === 429) {
    return { retryable: true, backoff: "exponential", maxRetries: 5 };
  }

  // Timeouts → retry immediately
  if (error.code === "ETIMEDOUT") {
    return { retryable: true, backoff: "immediate", maxRetries: 3 };
  }

  // Server errors → retry with backoff
  if (error.status >= 500) {
    return { retryable: true, backoff: "exponential", maxRetries: 3 };
  }

  // Invalid input → don't retry
  if (error.status === 400) {
    return { retryable: false, backoff: "none", maxRetries: 0 };
  }

  // Auth errors → don't retry
  if (error.status === 401 || error.status === 403) {
    return { retryable: false, backoff: "none", maxRetries: 0 };
  }

  // Unknown → retry once
  return { retryable: true, backoff: "exponential", maxRetries: 1 };
}
```

### Implement Smart Retries

```typescript
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const classification = classifyError(error);

      if (!classification.retryable || attempt > maxRetries) {
        throw error;
      }

      // Calculate delay
      let delay = 0;
      if (classification.backoff === "exponential") {
        delay = baseDelay * Math.pow(2, attempt - 1);
      } else if (classification.backoff === "immediate") {
        delay = baseDelay;
      }

      // Add jitter to prevent thundering herd
      delay += Math.random() * 1000;

      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}
```

## 2. Rate Limiting

Respect provider rate limits before you hit them.

### Per-Provider Rate Limiters

```typescript
class RateLimiter {
  private buckets = new Map<string, TokenBucket>();

  constructor(private limits: Record<string, RateLimit>) {
    for (const [provider, limit] of Object.entries(limits)) {
      this.buckets.set(provider, new TokenBucket(limit));
    }
  }

  async acquire(provider: string): Promise<void> {
    const bucket = this.buckets.get(provider);
    if (!bucket) {
      throw new Error(`No rate limit configured for ${provider}`);
    }

    await bucket.acquire();
  }

  release(provider: string): void {
    const bucket = this.buckets.get(provider);
    bucket?.release();
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(private limit: RateLimit) {
    this.tokens = limit.maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    while (this.tokens < 1) {
      await sleep(100);
      this.refill();
    }

    this.tokens--;
  }

  release(): void {
    // Optional: return token immediately
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd =
      (elapsed / this.limit.refillInterval) * this.limit.tokensPerInterval;

    this.tokens = Math.min(this.limit.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Usage
const limiter = new RateLimiter({
  replicate: { maxTokens: 10, tokensPerInterval: 10, refillInterval: 60000 },
  fal: { maxTokens: 50, tokensPerInterval: 50, refillInterval: 60000 },
  elevenlabs: { maxTokens: 5, tokensPerInterval: 5, refillInterval: 60000 },
});

await limiter.acquire("replicate");
try {
  await generateVideo({ provider: "replicate" });
} finally {
  limiter.release("replicate");
}
```

## 3. Idempotency

Make operations safe to retry without side effects.

### Idempotency Keys

```typescript
interface Operation {
  idempotencyKey: string;
  fn: () => Promise<any>;
}

class IdempotentExecutor {
  private cache = new Map<string, any>();
  private inProgress = new Map<string, Promise<any>>();

  async execute(op: Operation): Promise<any> {
    // Check cache
    if (this.cache.has(op.idempotencyKey)) {
      console.log("Cache hit:", op.idempotencyKey);
      return this.cache.get(op.idempotencyKey);
    }

    // Check if in progress
    if (this.inProgress.has(op.idempotencyKey)) {
      console.log("Waiting for in-progress operation:", op.idempotencyKey);
      return this.inProgress.get(op.idempotencyKey);
    }

    // Execute
    const promise = op.fn();
    this.inProgress.set(op.idempotencyKey, promise);

    try {
      const result = await promise;
      this.cache.set(op.idempotencyKey, result);
      return result;
    } finally {
      this.inProgress.delete(op.idempotencyKey);
    }
  }
}

// Usage
const executor = new IdempotentExecutor();

const result = await executor.execute({
  idempotencyKey: `video-${userId}-${timestamp}`,
  fn: () => generateVideo({ prompt }),
});
```

## 4. Graceful Degradation

When things fail, degrade gracefully instead of crashing.

### Fallback Chains

```typescript
async function generateWithFallback(prompt: string): Promise<string> {
  const strategies = [
    // Primary: High quality, slow
    async () => generateVideo({ model: "high-quality-model", prompt }),

    // Fallback 1: Medium quality, faster
    async () => generateVideo({ model: "medium-quality-model", prompt }),

    // Fallback 2: Low quality, fastest
    async () => generateVideo({ model: "fast-model", prompt }),

    // Final fallback: Placeholder
    async () => "https://cdn.example.com/placeholder-video.mp4",
  ];

  for (const [index, strategy] of strategies.entries()) {
    try {
      console.log(`Trying strategy ${index + 1}...`);
      return await strategy();
    } catch (error) {
      console.error(`Strategy ${index + 1} failed:`, error.message);

      if (index === strategies.length - 1) {
        throw error;
      }
    }
  }

  throw new Error("All strategies failed");
}
```

## 5. Versioning and Model Locking

Lock model versions to prevent breaking changes.

### Version Pinning

```typescript
// ❌ Bad: Uses latest version (can break)
const video = await generateVideo({
  model: "bytedance/seedance", // Unversioned
});

// ✅ Good: Locks to specific version
const video = await generateVideo({
  model: "bytedance/seedance:version-abc123", // Versioned
});
```

### Version Migration

```typescript
interface ModelVersion {
  model: string;
  version: string;
  deprecated: boolean;
  replacement?: string;
}

class ModelRegistry {
  private versions: Map<string, ModelVersion> = new Map();

  async getModel(name: string): Promise<ModelVersion> {
    const version = this.versions.get(name);

    if (!version) {
      throw new Error(`Model ${name} not found`);
    }

    if (version.deprecated && version.replacement) {
      console.warn(
        `Model ${name} is deprecated. Use ${version.replacement} instead.`,
      );
    }

    return version;
  }

  async migrateModel(from: string, to: string): Promise<void> {
    console.log(`Migrating from ${from} to ${to}...`);

    // Update version mapping
    this.versions.set(from, {
      model: to,
      version: "latest",
      deprecated: true,
      replacement: to,
    });
  }
}
```

## 6. Isolation and Circuit Breakers

Isolate failures to prevent cascade effects.

### Circuit Breaker Pattern

```typescript
enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests
  HALF_OPEN = "HALF_OPEN", // Testing recovery
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        console.log("Circuit breaker: Trying half-open");
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      console.log("Circuit breaker: Opening circuit");
      this.state = CircuitState.OPEN;
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

await breaker.execute(() => generateVideo({ prompt }));
```

## 7. Observability

You can't fix what you can't see.

### Structured Logging

```typescript
interface LogContext {
  executionId: string;
  userId: string;
  operation: string;
  provider?: string;
  model?: string;
}

class Logger {
  log(level: string, message: string, context: LogContext, data?: any) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
        ...data,
      }),
    );
  }

  info(message: string, context: LogContext, data?: any) {
    this.log("INFO", message, context, data);
  }

  error(message: string, context: LogContext, error: Error) {
    this.log("ERROR", message, context, {
      error: error.message,
      stack: error.stack,
    });
  }
}

// Usage
const logger = new Logger();

logger.info("Starting video generation", {
  executionId: "exec_123",
  userId: "user_456",
  operation: "generate-video",
  provider: "replicate",
  model: "animate-diff",
});
```

### Metrics and Tracing

```typescript
class Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(metric: string, value: number = 1) {
    this.counters.set(metric, (this.counters.get(metric) || 0) + value);
  }

  record(metric: string, value: number) {
    const values = this.histograms.get(metric) || [];
    values.push(value);
    this.histograms.set(metric, values);
  }

  async flush() {
    // Send to monitoring system (DataDog, CloudWatch, etc.)
    console.log("Counters:", Object.fromEntries(this.counters));
    console.log("Histograms:", Object.fromEntries(this.histograms));
  }
}

// Usage
const metrics = new Metrics();

const start = Date.now();
try {
  await generateVideo({ prompt });
  metrics.increment("video.generation.success");
} catch (error) {
  metrics.increment("video.generation.failure");
} finally {
  metrics.record("video.generation.duration", Date.now() - start);
}
```

## 8. Cost Tracking

Track costs per operation to prevent runaway spending.

```typescript
interface CostTracker {
  track(operation: string, provider: string, cost: number): void;
  getTotal(userId?: string): number;
  getByProvider(): Record<string, number>;
}

class SimpleCostTracker implements CostTracker {
  private costs: Array<{
    userId: string;
    operation: string;
    provider: string;
    cost: number;
    timestamp: Date;
  }> = [];

  track(
    operation: string,
    provider: string,
    cost: number,
    userId: string = "anonymous",
  ) {
    this.costs.push({
      userId,
      operation,
      provider,
      cost,
      timestamp: new Date(),
    });

    // Check if user exceeded budget
    const userTotal = this.getTotal(userId);
    if (userTotal > 100) {
      console.warn(`User ${userId} exceeded budget: $${userTotal}`);
    }
  }

  getTotal(userId?: string): number {
    return this.costs
      .filter((c) => !userId || c.userId === userId)
      .reduce((sum, c) => sum + c.cost, 0);
  }

  getByProvider(): Record<string, number> {
    const byProvider: Record<string, number> = {};

    for (const cost of this.costs) {
      byProvider[cost.provider] = (byProvider[cost.provider] || 0) + cost.cost;
    }

    return byProvider;
  }
}
```

## 9. Testing Strategies

Test AI pipelines without calling real APIs.

### Mock Providers

```typescript
interface MockConfig {
  latency?: number;
  failureRate?: number;
  response?: any;
}

class MockProvider {
  constructor(private config: MockConfig = {}) {}

  async generate(params: any): Promise<any> {
    // Simulate latency
    await sleep(this.config.latency || 1000);

    // Simulate failures
    if (Math.random() < (this.config.failureRate || 0)) {
      throw new Error("Mock provider failure");
    }

    // Return mock response
    return this.config.response || { url: "https://mock-cdn.com/video.mp4" };
  }
}

// Usage in tests
const provider = new MockProvider({
  latency: 100,
  failureRate: 0.1,
  response: { url: "https://test-cdn.com/test-video.mp4" },
});
```

## 10. Production Checklist

Before deploying:

- ✅ **Retry logic** for transient failures
- ✅ **Rate limiting** per provider
- ✅ **Idempotency keys** for all operations
- ✅ **Fallback strategies** for critical paths
- ✅ **Model version pinning** to prevent breaks
- ✅ **Circuit breakers** for failing services
- ✅ **Structured logging** with context
- ✅ **Metrics and alerts** for anomalies
- ✅ **Cost tracking** and budget limits
- ✅ **Integration tests** with mocks

## Wrapping Up

Production AI pipelines require defensive coding:

**Key takeaways:**

- Classify errors before retrying
- Rate limit proactively, not reactively
- Make operations idempotent
- Degrade gracefully with fallbacks
- Lock model versions
- Isolate failures with circuit breakers
- Log everything with structure
- Track costs per operation
- Test with mocks

Build these patterns in from day one—retrofitting them later is painful.

---

**Further reading:**

- Learn about advanced monitoring strategies
- Explore distributed tracing for pipelines
- Study chaos engineering for AI systems
