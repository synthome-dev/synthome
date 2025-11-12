# Execution Guide

## Execution Modes

The SDK supports two execution modes:

### 1. **Blocking Mode (Default)**

When no `webhookUrl` is provided, `execute()` blocks and waits for completion:

```typescript
import { compose, generateVideo, replicate } from "@repo/ai-video-sdk";

// Blocks until complete
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A beautiful sunset",
    duration: 5,
  }),
).execute();

// When we reach here, the execution is DONE
console.log(execution.status); // "completed"
console.log(execution.result); // { url: "https://...", ... }
```

**Best for:**

- Scripts and CLI tools
- Simple synchronous workflows
- Testing and development

### 2. **Non-Blocking Mode (with Webhook)**

When a `webhookUrl` is provided, `execute()` returns immediately:

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A beautiful sunset",
    duration: 5,
  }),
).execute({
  webhookUrl: "https://myapp.com/webhook",
  webhookSecret: "my-secret-123",
});

// Returns immediately
console.log(execution.status); // "pending" or "processing"

// Your webhook endpoint receives POST when done:
// {
//   executionId: "...",
//   status: "completed",
//   result: { url: "https://...", ... }
// }
```

**Best for:**

- Production web applications
- Long-running operations
- Distributed systems
- When you don't want to block server threads

## Progress Callbacks

Track progress during blocking execution with `onProgress()`:

```typescript
const execution = await compose(
  generateVideo({
    /* ... */
  }),
)
  .onProgress((progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Job: ${progress.currentJob}`);
    console.log(`Completed: ${progress.completedJobs}/${progress.totalJobs}`);
  })
  .execute();

// Automatically waits for completion
console.log("Done!", execution.result);
```

## Accessing Results

After blocking execution completes, results are available immediately:

```typescript
const execution = await pipeline.execute();

if (execution.status === "completed") {
  console.log("Video URL:", execution.result?.url);
  console.log("Duration:", execution.result?.duration);
  console.log("Aspect Ratio:", execution.result?.aspectRatio);
}

if (execution.status === "failed") {
  // Use getStatus() to get error details
  const status = await execution.getStatus();
  console.error("Error:", status.error);
}
```

## Pipeline Execution with Dependencies

The SDK supports creating pipelines that depend on parent executions:

```typescript
// Execute a base pipeline once
const baseExecution = await productDemo.execute();

// Create variants that reuse the base result
await frenchVariant.execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://myapp.com/webhook/french",
});

await spanishVariant.execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://myapp.com/webhook/spanish",
});

// Backend ensures variants wait for base to complete before starting
```

## API Reference

### ExecuteOptions

```typescript
interface ExecuteOptions {
  apiKey?: string; // SYNTHOME_API_KEY for authorization
  apiUrl?: string; // API endpoint URL
  baseExecutionId?: string; // Reference parent execution
  webhookUrl?: string; // Webhook endpoint for async results
  webhookSecret?: string; // HMAC secret for webhook verification
  providerApiKeys?: {
    // Provider API keys (auto-detected from env)
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  };
}
```

### PipelineExecution

```typescript
interface PipelineExecution {
  id: string; // Execution ID
  status: "pending" | "processing" | "completed" | "failed";
  result?: Video; // Available after blocking completion
  onComplete(callback: (video: Video) => void): void; // Callback on completion
  onError(callback: (error: Error) => void): void; // Callback on error
  getStatus(): Promise<ExecutionStatusResponse>; // Manual status check
}
```

### Video Result

```typescript
interface Video {
  url: string; // URL to the video
  status: string; // Status of the video
  aspectRatio: string; // e.g., "16:9"
  duration: number; // Duration in seconds
}
```

## What We Implemented

### 1. **Blocking Execution by Default**

- `execute()` without webhook now blocks and waits
- Results available immediately via `execution.result`
- Progress callbacks fire during execution

### 2. **Webhook Support for Async**

- Provide `webhookUrl` to receive POST when complete
- Optional `webhookSecret` for HMAC verification
- No polling needed - backend pushes results to you

### 3. **Pipeline Dependencies**

- Execute base pipeline once
- Create variants that reuse base results
- Backend ensures proper execution order
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

````

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
````

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
