# How to Build the Backend for an AI Video App

Building the backend for an AI video application means orchestrating async operations, managing state across multi-step workflows, handling failures gracefully, and keeping costs under control. This guide walks through the complete architecture—from API design to job queues, storage, and webhooks—for a production-ready AI video app.

---

## What Makes AI Video Backends Different?

Traditional app backends handle requests in milliseconds. AI video backends handle requests that take minutes and cost dollars.

**Traditional backend:**
```
Request → Database query (10ms) → Response
```

**AI video backend:**
```
Request → Queue job → Multiple AI API calls (60-180s) → Process → Store → Webhook
```

This fundamental difference changes everything:

- **Async-first**: HTTP requests can't wait 3 minutes
- **Expensive failures**: A failed job at step 5 means you've paid for steps 1-4
- **State management**: Users need progress updates
- **Cost control**: Runaway jobs can cost thousands
- **Multi-tenancy**: Users need isolated executions

## Architecture Overview

Here's the complete system architecture:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST /api/generate
       ▼
┌─────────────────────────────────────┐
│          API Layer                  │
│  - Validation                       │
│  - Auth                             │
│  - Rate limiting                    │
│  - Return execution ID              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Job Queue (Redis/SQS)          │
│  - Manage execution order           │
│  - Handle retries                   │
│  - Respect rate limits              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Worker Processes             │
│  - Call AI provider APIs            │
│  - Poll for completion              │
│  - Upload results to CDN            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      State Storage (PostgreSQL)     │
│  - Execution status                 │
│  - Job results                      │
│  - Progress tracking                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Webhook Delivery               │
│  - Notify client of completion      │
│  - Signed payloads                  │
│  - Retry failed deliveries          │
└─────────────────────────────────────┘
```

Let's build each component.

## 1. API Layer

The API accepts video generation requests and returns immediately with an execution ID.

```typescript
// src/api/routes.ts
import express from "express";
import { z } from "zod";
import { createExecution } from "../services/execution";
import { enqueueJob } from "../services/queue";

const app = express();
app.use(express.json());

// Request validation schema
const generateVideoSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().min(1).max(30).optional(),
  webhook: z.string().url().optional(),
  webhookSecret: z.string().optional(),
});

app.post("/api/generate-video", async (req, res) => {
  try {
    // 1. Validate input
    const params = generateVideoSchema.parse(req.body);
    
    // 2. Check user limits
    const userId = req.user.id;  // From auth middleware
    await checkUserLimits(userId);
    
    // 3. Create execution record
    const execution = await createExecution({
      userId,
      type: "generate-video",
      params,
      status: "queued",
    });
    
    // 4. Enqueue job
    await enqueueJob({
      executionId: execution.id,
      type: "generate-video",
      params,
      webhook: params.webhook,
    });
    
    // 5. Return immediately
    res.json({
      executionId: execution.id,
      status: "queued",
      statusUrl: `/api/executions/${execution.id}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Check execution status
app.get("/api/executions/:id", async (req, res) => {
  const execution = await getExecution(req.params.id);
  
  if (!execution) {
    return res.status(404).json({ error: "Execution not found" });
  }
  
  // Only allow users to view their own executions
  if (execution.userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  res.json({
    id: execution.id,
    status: execution.status,
    progress: execution.progress,
    currentJob: execution.currentJob,
    result: execution.result,
    error: execution.error,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  });
});

async function checkUserLimits(userId: string): Promise<void> {
  const usage = await getUserUsage(userId);
  
  if (usage.videosThisMonth >= usage.monthlyLimit) {
    throw new Error("Monthly video limit exceeded");
  }
  
  if (usage.costThisMonth >= usage.costLimit) {
    throw new Error("Monthly cost limit exceeded");
  }
}
```

## 2. Database Schema

Store execution state in PostgreSQL:

```sql
-- executions table
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  params JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  progress INTEGER DEFAULT 0,
  current_job VARCHAR(100),
  completed_jobs TEXT[],
  failed_jobs TEXT[],
  result JSONB,
  error TEXT,
  webhook VARCHAR(500),
  webhook_secret VARCHAR(100),
  webhook_delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_user ON executions(user_id, created_at DESC);

-- jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id),
  type VARCHAR(50) NOT NULL,
  params JSONB NOT NULL,
  dependencies TEXT[],
  status VARCHAR(20) NOT NULL,
  retries INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for queue processing
CREATE INDEX idx_jobs_status ON jobs(status, created_at);
CREATE INDEX idx_jobs_execution ON jobs(execution_id);
```

## 3. Job Queue

Use Redis with BullMQ for reliable job processing:

```typescript
// src/services/queue.ts
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL);

// Create queue
const videoQueue = new Queue("video-generation", { connection });

// Enqueue job
export async function enqueueJob(job: VideoJob): Promise<void> {
  await videoQueue.add(job.type, job, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
}

// Worker process
const worker = new Worker(
  "video-generation",
  async (job: Job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    
    try {
      const result = await processJob(job.data);
      return result;
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,  // Process 5 jobs in parallel
  }
);

worker.on("completed", async (job) => {
  console.log(`Job ${job.id} completed`);
  await updateExecutionStatus(job.data.executionId, {
    status: "completed",
    result: job.returnvalue,
  });
  await deliverWebhook(job.data.executionId);
});

worker.on("failed", async (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
  await updateExecutionStatus(job.data.executionId, {
    status: "failed",
    error: error.message,
  });
  await deliverWebhook(job.data.executionId);
});
```

## 4. Worker Implementation

Workers call AI provider APIs and handle polling:

```typescript
// src/workers/video-generator.ts
import fetch from "node-fetch";

interface VideoJob {
  executionId: string;
  prompt: string;
  duration: number;
}

export async function processJob(job: VideoJob): Promise<string> {
  // Update progress: Starting
  await updateProgress(job.executionId, 10, "Generating image...");
  
  // Step 1: Generate image
  const imageUrl = await generateImage(job.prompt);
  
  // Update progress: Image complete
  await updateProgress(job.executionId, 40, "Animating video...");
  
  // Step 2: Animate to video
  const videoUrl = await generateVideo(imageUrl, job.duration);
  
  // Update progress: Complete
  await updateProgress(job.executionId, 100, "Done!");
  
  return videoUrl;
}

async function generateImage(prompt: string): Promise<string> {
  const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  
  const data = await response.json();
  return data.images[0].url;
}

async function generateVideo(imageUrl: string, duration: number): Promise<string> {
  // Submit job
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "video-model-version",
      input: { image: imageUrl, duration },
    }),
  });
  
  const prediction = await response.json();
  
  // Poll for completion
  let videoUrl: string | null = null;
  while (!videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusRes = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      { headers: { "Authorization": `Token ${process.env.REPLICATE_API_KEY}` } }
    );
    
    const status = await statusRes.json();
    
    if (status.status === "succeeded") {
      videoUrl = status.output[0];
    } else if (status.status === "failed") {
      throw new Error(`Video generation failed: ${status.error}`);
    }
  }
  
  // Upload to CDN
  const cdnUrl = await uploadToCDN(videoUrl);
  return cdnUrl;
}

async function uploadToCDN(url: string): Promise<string> {
  // Download from provider
  const response = await fetch(url);
  const buffer = await response.buffer();
  
  // Upload to S3/R2
  const key = `videos/${Date.now()}.mp4`;
  await s3.putObject({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: "video/mp4",
  });
  
  return `https://cdn.example.com/${key}`;
}

async function updateProgress(
  executionId: string,
  progress: number,
  message: string
): Promise<void> {
  await db.executions.update({
    where: { id: executionId },
    data: {
      progress,
      currentJob: message,
      updatedAt: new Date(),
    },
  });
}
```

## 5. Webhook Delivery

Notify clients when executions complete:

```typescript
// src/services/webhook.ts
import { createHmac } from "crypto";

export async function deliverWebhook(executionId: string): Promise<void> {
  const execution = await getExecution(executionId);
  
  if (!execution.webhook) {
    return;  // No webhook configured
  }
  
  const payload = {
    executionId: execution.id,
    status: execution.status,
    result: execution.result,
    error: execution.error,
    timestamp: new Date().toISOString(),
  };
  
  // Sign payload
  const signature = createHmac("sha256", execution.webhookSecret || "")
    .update(JSON.stringify(payload))
    .digest("hex");
  
  try {
    const response = await fetch(execution.webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "User-Agent": "YourApp-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      timeout: 30000,  // 30-second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }
    
    // Mark as delivered
    await db.executions.update({
      where: { id: executionId },
      data: { webhookDeliveredAt: new Date() },
    });
  } catch (error) {
    console.error(`Failed to deliver webhook for ${executionId}:`, error);
    
    // Retry after delay
    await scheduleWebhookRetry(executionId);
  }
}

async function scheduleWebhookRetry(executionId: string): Promise<void> {
  // Add to retry queue with exponential backoff
  await webhookRetryQueue.add(
    "retry-webhook",
    { executionId },
    {
      delay: 60000,  // 1 minute
      attempts: 5,
      backoff: { type: "exponential", delay: 60000 },
    }
  );
}
```

## 6. Cost Tracking

Track costs per execution:

```typescript
// src/services/usage.ts
const PROVIDER_COSTS = {
  "fal-image": 0.003,
  "replicate-video": 0.02,
  "elevenlabs-audio": 0.00015,  // per character
};

export async function trackCost(
  executionId: string,
  operation: string,
  params: any
): Promise<void> {
  let cost = 0;
  
  if (operation === "fal-image") {
    cost = PROVIDER_COSTS["fal-image"];
  } else if (operation === "replicate-video") {
    cost = PROVIDER_COSTS["replicate-video"];
  } else if (operation === "elevenlabs-audio") {
    const charCount = params.text.length;
    cost = charCount * PROVIDER_COSTS["elevenlabs-audio"];
  }
  
  await db.costs.create({
    data: {
      executionId,
      operation,
      cost,
      timestamp: new Date(),
    },
  });
  
  // Update user's monthly usage
  const execution = await getExecution(executionId);
  await incrementUserCost(execution.userId, cost);
}

async function incrementUserCost(userId: string, amount: number): Promise<void> {
  await db.users.update({
    where: { id: userId },
    data: {
      costThisMonth: { increment: amount },
    },
  });
}
```

## 7. Using an SDK Instead

Building all this infrastructure takes weeks. Here's the same functionality using a managed SDK:

```typescript
// src/api/routes-simple.ts
import express from "express";
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const app = express();
app.use(express.json());

app.post("/api/generate-video", async (req, res) => {
  const { prompt, duration, webhook } = req.body;
  
  // Validate
  if (!prompt || prompt.length === 0) {
    return res.status(400).json({ error: "Prompt required" });
  }
  
  // Execute pipeline
  const execution = await compose(
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt,
      duration: duration || 5,
    })
  ).execute({
    webhook: webhook || `${process.env.BASE_URL}/webhook`,
  });
  
  res.json({
    executionId: execution.id,
    status: execution.status,
    statusUrl: `/api/executions/${execution.id}`,
  });
});

app.post("/webhook", async (req, res) => {
  const { executionId, status, result } = req.body;
  
  // Notify user
  await notifyUser(executionId, result);
  
  res.sendStatus(200);
});

app.get("/api/executions/:id", async (req, res) => {
  const status = await getExecutionStatus(req.params.id);
  res.json(status);
});
```

**What the SDK handles:**
- Job queue and orchestration
- Worker processes
- Polling and retries
- State storage
- Webhook delivery
- Progress tracking
- Cost tracking

**What you handle:**
- API authentication
- User management
- Custom business logic

## 8. Deployment Architecture

### Option 1: Serverless + Managed Workers

```
API Layer:       AWS Lambda / Vercel Functions
Job Queue:       Managed by SDK (or AWS SQS)
Workers:         Managed by SDK (or AWS ECS)
Database:        PostgreSQL (Neon, Supabase)
Storage:         S3 / Cloudflare R2
```

**Pros:** Minimal infrastructure, scales automatically  
**Cons:** Less control, vendor lock-in

### Option 2: Containers (Full Control)

```
API Layer:       Docker containers (ECS, GKE, Railway)
Job Queue:       Redis + BullMQ
Workers:         Docker containers
Database:        PostgreSQL
Storage:         S3 / R2
```

**Pros:** Full control, portable  
**Cons:** More infrastructure to manage

## 9. Monitoring and Observability

Track key metrics:

```typescript
// src/services/metrics.ts
import { Metrics } from "@aws-sdk/client-cloudwatch";

export async function recordMetric(name: string, value: number): Promise<void> {
  await cloudwatch.putMetricData({
    Namespace: "AIVideoApp",
    MetricData: [
      {
        MetricName: name,
        Value: value,
        Unit: "Count",
        Timestamp: new Date(),
      },
    ],
  });
}

// Track execution metrics
await recordMetric("ExecutionsStarted", 1);
await recordMetric("ExecutionsCompleted", 1);
await recordMetric("ExecutionsFailed", 1);
await recordMetric("ExecutionDuration", durationMs);
await recordMetric("ExecutionCost", costUsd);
```

**Key metrics:**
- Executions per hour
- Success rate
- Average execution time
- P95 execution time
- Total cost per day
- Queue depth
- Worker utilization

## 10. Security Best Practices

### API Key Management

```typescript
// Store provider API keys encrypted
await db.providerKeys.create({
  data: {
    userId,
    provider: "replicate",
    encryptedKey: encrypt(apiKey),
  },
});

// Decrypt when needed
const key = decrypt(providerKey.encryptedKey);
```

### Webhook Signature Verification

```typescript
export function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return signature === `sha256=${expected}`;
}
```

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: "Too many requests, please try again later",
});

app.use("/api/", limiter);
```

## Wrapping Up

Building a production AI video app backend requires:

1. **API layer**: Accept requests, validate, return execution IDs
2. **Job queue**: Manage async execution with retries
3. **Worker processes**: Call AI providers, handle polling
4. **State storage**: Track executions and progress
5. **Webhooks**: Notify clients of completion
6. **Cost tracking**: Monitor usage and enforce limits
7. **Monitoring**: Track metrics and set alerts

You can build this yourself (weeks of work) or use a managed SDK (hours). Either way, understanding these patterns is critical for reliable AI video applications.

**Key takeaways:**

- Always return immediately from API calls (async-first)
- Use job queues for orchestration
- Track costs per execution
- Implement retries for transient failures
- Deliver webhooks with signed payloads
- Monitor everything

---

**Further reading:**

- Learn about advanced orchestration patterns
- Explore multi-tenancy and team management
- Study cost optimization strategies for AI backends
