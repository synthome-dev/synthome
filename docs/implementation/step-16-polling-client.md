# Step 16: SDK Polling Client

## Overview

Implement the client-side polling mechanism in the SDK to check execution status.

## Files to Modify

- `packages/ai-video-sdk/src/compose/pipeline.ts`
- `packages/ai-video-sdk/src/core/types.ts`

## Enhanced PipelineExecution Class

### compose/pipeline.ts

```typescript
export class PipelineExecution {
  constructor(
    public readonly id: string,
    public status: ExecutionStatus,
    private apiUrl: string,
  ) {}

  async poll(intervalMs: number = 2000): Promise<ExecutionResult> {
    while (true) {
      const status = await this.getStatus();

      if (status.status === "completed") {
        return {
          url: status.result.url,
          outputs: status.jobs.reduce(
            (acc, job) => {
              acc[job.id] = job.result;
              return acc;
            },
            {} as Record<string, any>,
          ),
        };
      }

      if (status.status === "failed") {
        throw new Error(`Execution failed: ${status.error}`);
      }

      await this.sleep(intervalMs);
    }
  }

  async onComplete(timeoutMs?: number): Promise<ExecutionResult> {
    const pollPromise = this.poll();

    if (timeoutMs) {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Execution timeout")), timeoutMs);
      });
      return Promise.race([pollPromise, timeout]);
    }

    return pollPromise;
  }

  async getStatus(): Promise<ExecutionStatusResponse> {
    const response = await fetch(
      `${this.apiUrl}/api/execute/${this.id}/status`,
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

## Enhanced VideoExecution Class

```typescript
export class VideoExecution {
  async execute(options?: ExecuteOptions): Promise<PipelineExecution> {
    const apiUrl =
      options?.apiUrl ||
      process.env.OPENVIDEO_API_URL ||
      "http://localhost:3000";

    const response = await fetch(`${apiUrl}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executionPlan: this.plan,
        options: {
          baseExecutionId: options?.baseExecutionId,
          webhookUrl: options?.webhookUrl,
          webhookSecret: options?.webhookSecret,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Execution failed: ${response.statusText}`);
    }

    const { id, status } = await response.json();

    return new PipelineExecution(id, status, apiUrl);
  }
}
```

## Usage Example

```typescript
const pipeline = compose()
  .generateVideo({ prompt: "test" })
  .addSubtitles({ text: "Hello" });

const execution = await pipeline.execute();

console.log(`Execution started: ${execution.id}`);

const result = await execution.onComplete();

console.log(`Video ready: ${result.url}`);
console.log("Outputs:", result.outputs);
```

## With Timeout

```typescript
try {
  const result = await execution.onComplete(60000); // 1 minute timeout
  console.log("Completed:", result);
} catch (error) {
  console.error("Timeout or error:", error);
}
```

## Completion Criteria

- [ ] PipelineExecution polls status endpoint
- [ ] onComplete() waits for completion
- [ ] Supports timeout
- [ ] Returns all job outputs
- [ ] Throws on execution failure
