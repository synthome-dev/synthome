# Execution Dependencies & Webhooks Implementation

## What We Implemented

### 1. **Pipeline Execution with Dependencies**

The SDK now supports creating pipelines that depend on parent executions. This allows you to:

- Execute a base pipeline once
- Create multiple variants that reuse the base pipeline's results
- Backend ensures variants wait for base to complete before starting

### 2. **Webhook Support**

Added webhook configuration to receive results asynchronously:

- Execute with `webhookUrl` to receive POST when complete
- Optional `webhookSecret` for HMAC verification
- No polling needed - backend pushes results to you

### 3. **Polling Fallback**

If no webhook is provided, SDK automatically polls for completion:

- Progress callbacks via `.onProgress()`
- Completion callbacks via `execution.onComplete()`

## API Changes

### New Types

**`ExecuteOptions`** - Configuration for pipeline execution:

```typescript
interface ExecuteOptions {
  apiKey?: string;
  apiUrl?: string;
  baseExecutionId?: string; // Reference parent execution
  webhookUrl?: string; // Webhook endpoint for results
  webhookSecret?: string; // HMAC secret for webhook verification
}
```

**`PipelineExecution`** - Return value from `execute()`:

```typescript
interface PipelineExecution {
  id: string; // Execution ID for tracking/dependencies
  status: "pending" | "processing" | "completed" | "failed";
  onComplete(callback: (video: Video) => void): void;
}
```

### Updated Methods

**`Pipeline.execute(config?: ExecuteOptions): Promise<PipelineExecution>`**

- Returns execution object instead of final video
- Supports `baseExecutionId` for dependencies
- Supports webhook configuration

**`ExecutionPlan`** - Now includes optional base execution reference:

```typescript
interface ExecutionPlan {
  jobs: JobNode[];
  baseExecutionId?: string; // Reference to parent execution
}
```

## Usage Examples

### Example 1: Base Pipeline + Variants with Webhooks

```typescript
import {
  compose,
  generateVideo,
  merge,
  lipSync,
  addSubtitles,
} from "@repo/ai-video-sdk";

// Create base product demo
const productDemo = compose(
  generateVideo({ prompt: "Scene 1", duration: 3 }),
  generateVideo({ prompt: "Scene 2", duration: 3 }),
  generateVideo({ prompt: "Scene 3", duration: 3 }),
  merge({ transition: "crossfade" }),
);

// Execute base (no webhook, just start it)
const baseExecution = await productDemo.execute();
console.log(`Base started: ${baseExecution.id}`);

// Create French variant that depends on base
await compose(
  productDemo,
  lipSync({ audioUrl: "https://cdn.example.com/french.mp3" }),
  addSubtitles({ language: "fr" }),
).execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://api.example.com/webhook/french",
  webhookSecret: "secret123",
});

// Create Spanish variant that depends on base
await compose(
  productDemo,
  lipSync({ audioUrl: "https://cdn.example.com/spanish.mp3" }),
  addSubtitles({ language: "es" }),
).execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://api.example.com/webhook/spanish",
  webhookSecret: "secret123",
});

// Backend will:
// 1. Execute base pipeline (job1, job2, job3, job4)
// 2. French & Spanish pipelines wait for job4 to complete
// 3. Execute French & Spanish in parallel
// 4. POST to webhooks when each completes
```

### Example 2: Polling with Callbacks

```typescript
const pipeline = compose(
  generateVideo({ prompt: "A beautiful landscape" }),
  reframe({ aspectRatio: "9:16" }),
);

// Track progress
pipeline.onProgress((progress) => {
  console.log(`${progress.completedJobs}/${progress.totalJobs} jobs completed`);
});

// Execute without webhook = auto-poll
const execution = await pipeline.execute();

// Get notified when complete
execution.onComplete((video) => {
  console.log(`Video ready: ${video.url}`);
});
```

### Example 3: Webhook Only (Fire and Forget)

```typescript
const pipeline = compose(
  generateVideo({ prompt: "Long video" }),
  lipSync({ audioUrl: "https://..." }),
);

const execution = await pipeline.execute({
  webhookUrl: "https://api.example.com/webhook/complete",
  webhookSecret: "secret123",
});

console.log(`Execution started: ${execution.id}`);
// Returns immediately, no polling
// Webhook will be called when complete
```

## JSON Payload Format

### Base Execution Request

```json
POST /api/execute
{
  "jobs": [
    { "id": "job1", "type": "generate", "params": {...}, "output": "$job1" },
    { "id": "job2", "type": "generate", "params": {...}, "output": "$job2" },
    { "id": "job3", "type": "merge", "params": {...}, "dependsOn": ["job1", "job2"], "output": "$job3" }
  ]
}
```

Response:

```json
{
  "executionId": "exec_abc123"
}
```

### Dependent Execution Request

```json
POST /api/execute
{
  "jobs": [
    { "id": "job1", "type": "lipSync", "params": {...}, "output": "$job1" },
    { "id": "job2", "type": "addSubtitles", "params": {...}, "dependsOn": ["job1"], "output": "$job2" }
  ],
  "baseExecutionId": "exec_abc123",
  "webhook": {
    "url": "https://api.example.com/webhook/french",
    "secret": "secret123"
  }
}
```

Response:

```json
{
  "executionId": "exec_french_456"
}
```

### Webhook Callback (from backend to client)

```json
POST https://api.example.com/webhook/french
Headers:
  X-Webhook-Signature: <HMAC-SHA256(secret, body)>

Body:
{
  "executionId": "exec_french_456",
  "status": "completed",
  "video": {
    "url": "https://cdn.example.com/french-video.mp4",
    "duration": 9,
    "aspectRatio": "16:9",
    "status": "completed"
  }
}
```

## Backend Implementation Requirements

### 1. **Execution Tracking**

Store executions in database:

```typescript
interface Execution {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  jobs: JobNode[];
  baseExecutionId?: string;
  webhook?: { url: string; secret?: string };
  result?: Video;
  createdAt: Date;
  completedAt?: Date;
}
```

### 2. **Job Dependency Resolution**

When creating jobs with `baseExecutionId`:

1. Look up base execution in database
2. Find final job ID from base execution (last job in sequence)
3. Create new jobs that depend on base execution's final job

Example:

```typescript
// Base execution has jobs: [job1, job2, job3, job4]
// Final job: job4

// Dependent execution creates:
// job5 (lipSync) - depends on job4 from base execution
// job6 (addSubtitles) - depends on job5
```

### 3. **PgBoss Job Creation**

```typescript
// For dependent execution
if (execution.baseExecutionId) {
  const baseExecution = await db.executions.get(execution.baseExecutionId);
  const baseFinalJobId = baseExecution.jobs[baseExecution.jobs.length - 1].id;

  // First job of dependent execution depends on base's final job
  await boss.send("video-job", {
    executionId: execution.id,
    jobId: "job1",
    type: "lipSync",
    params: {...},
    dependsOn: [baseFinalJobId] // Cross-execution dependency
  });
}
```

### 4. **Webhook Delivery**

When execution completes:

```typescript
async function completeExecution(executionId: string, result: Video) {
  const execution = await db.executions.get(executionId);
  execution.status = "completed";
  execution.result = result;

  if (execution.webhook) {
    const payload = {
      executionId,
      status: "completed",
      video: result,
    };

    const signature = crypto
      .createHmac("sha256", execution.webhook.secret || "")
      .update(JSON.stringify(payload))
      .digest("hex");

    await fetch(execution.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: JSON.stringify(payload),
    });
  }
}
```

### 5. **Status Endpoint** (for polling)

```typescript
app.get("/api/execute/:executionId/status", async (req, res) => {
  const execution = await db.executions.get(req.params.executionId);

  const completedJobs = execution.jobs.filter(
    (j) => j.status === "completed",
  ).length;

  res.json({
    status: execution.status,
    progress: (completedJobs / execution.jobs.length) * 100,
    totalJobs: execution.jobs.length,
    completedJobs,
    currentJob: execution.jobs.find((j) => j.status === "processing")?.id,
    result: execution.result,
  });
});
```

## Files Modified

```
packages/ai-video-sdk/
  src/
    core/
      video.ts                          # Added PipelineExecution, ExecuteOptions
      types.ts                          # (no changes)
    compose/
      pipeline.ts                       # VideoExecution class, updated execute()
      generate-video.ts                 # (no changes)
      operations.ts                     # (no changes)
    index.ts                            # Export new types
  examples/
    execution-demo.ts                   # NEW: Demonstrates webhook + dependencies
  COMPOSABLE.md                         # Updated documentation
```

## Benefits

1. **Efficiency** - Execute base pipeline once, reuse for multiple variants
2. **Parallel Processing** - Variants execute in parallel after base completes
3. **Scalability** - Webhooks avoid polling overhead
4. **Developer Experience** - Simple API, automatic dependency management

## Next Steps

1. **Backend Implementation** - Build the execution engine with PgBoss
2. **Webhook Security** - Implement HMAC signature verification
3. **Error Handling** - Partial failures, retries, rollbacks
4. **Monitoring** - Track execution times, success rates, webhook deliveries
