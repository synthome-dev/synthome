# How to Build a Video Generation API in Node.js

You want to offer AI video generation as a service. Users should be able to POST a prompt, get a job ID back, and poll for the result.

Sounds simple. But once you start building, questions appear:

- How do you handle jobs that take 2 minutes to complete?
- What if the AI provider is down?
- How do you track costs per user?
- Where do you store the generated videos?
- How do you prevent abuse?

This tutorial shows you how to build a production-ready video generation API in Node.js: REST endpoints, job queues, async workers, storage, error handling, and webhooks.

By the end, you'll have a working API that users can integrate with a few HTTP calls.

## What You'll Build

**API flow:**

1. User POSTs to `/api/generate` with a prompt
2. API creates a job and returns job ID immediately
3. Background worker processes the job (generates image → video → audio)
4. API provides `/api/status/:jobId` endpoint to check progress
5. When done, user retrieves the final video URL

**Tech stack:**

- **Node.js + Express** - REST API
- **BullMQ** - Job queue
- **Redis** - Job state persistence
- **Replicate/Fal** - AI model providers
- **S3/R2** - Video storage

## Architecture Overview

```
┌──────────┐    POST /generate    ┌──────────┐
│  Client  │ ───────────────────> │   API    │
└──────────┘                       └──────────┘
     │                                  │
     │                                  │ Add job to queue
     │                                  v
     │                             ┌──────────┐
     │                             │  Redis   │
     │                             └──────────┘
     │                                  │
     │ GET /status/:id                  │ Pick up job
     │ <─────────────────────           │
     │                                  v
     │                             ┌──────────┐
     │                             │  Worker  │───> AI Models
     │                             └──────────┘    (Replicate, Fal)
     │                                  │
     │                                  │ Upload video
     │                                  v
     │                             ┌──────────┐
     │                             │    S3    │
     └─────────────────────────────┴──────────┘
                Video URL
```

## Setup: Project Structure

### Initialize Project

```bash
mkdir video-gen-api
cd video-gen-api
npm init -y
npm install express bullmq ioredis @aws-sdk/client-s3 replicate dotenv zod
npm install --save-dev typescript @types/node @types/express tsx
npx tsc --init
```

### Project Structure

```
video-gen-api/
├── src/
│   ├── api/
│   │   ├── routes.ts        # Express routes
│   │   └── validate.ts      # Request validation
│   ├── worker/
│   │   ├── processor.ts     # Job processing logic
│   │   └── models.ts        # AI model integrations
│   ├── storage/
│   │   └── s3.ts            # S3 upload/download
│   ├── queue.ts             # BullMQ queue setup
│   ├── server.ts            # Express server
│   └── types.ts             # TypeScript types
├── .env
├── package.json
└── tsconfig.json
```

### Environment Variables

```bash
# .env
PORT=3000
REDIS_URL=redis://localhost:6379

# AI Providers
REPLICATE_API_TOKEN=r8_...
FAL_KEY=...

# Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=video-gen-output

# Optional
WEBHOOK_SECRET=your-webhook-secret
```

## Step 1: REST API Endpoint

### Define Types

```typescript
// src/types.ts
export interface GenerateRequest {
  prompt: string;
  script?: string;
  webhook_url?: string;
}

export interface GenerateResponse {
  job_id: string;
  status: "queued";
  estimated_time_seconds: number;
}

export interface StatusResponse {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  output?: {
    video_url: string;
    thumbnail_url: string;
    duration_seconds: number;
  };
  error?: string;
  cost?: number;
  created_at: string;
  completed_at?: string;
}
```

### Request Validation

```typescript
// src/api/validate.ts
import { z } from "zod";

export const GenerateSchema = z.object({
  prompt: z.string().min(1).max(500),
  script: z.string().max(1000).optional(),
  webhook_url: z.string().url().optional(),
});

export function validateGenerateRequest(body: unknown) {
  return GenerateSchema.parse(body);
}
```

### API Routes

```typescript
// src/api/routes.ts
import express from "express";
import { validateGenerateRequest } from "./validate";
import { videoQueue } from "../queue";
import type {
  GenerateRequest,
  GenerateResponse,
  StatusResponse,
} from "../types";

export const router = express.Router();

// POST /api/generate
router.post("/generate", async (req, res) => {
  try {
    // Validate request
    const input: GenerateRequest = validateGenerateRequest(req.body);

    // Add job to queue
    const job = await videoQueue.add("generate-video", {
      prompt: input.prompt,
      script: input.script,
      webhook_url: input.webhook_url,
    });

    // Return job ID immediately
    const response: GenerateResponse = {
      job_id: job.id as string,
      status: "queued",
      estimated_time_seconds: 120,
    };

    res.status(202).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid request", details: error.errors });
    } else {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// GET /api/status/:jobId
router.get("/status/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job from queue
    const job = await videoQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();
    const progress = (job.progress as number) || 0;

    const response: StatusResponse = {
      job_id: jobId,
      status:
        state === "completed"
          ? "completed"
          : state === "failed"
            ? "failed"
            : state === "active"
              ? "processing"
              : "queued",
      progress,
      created_at: new Date(job.timestamp).toISOString(),
    };

    if (state === "completed") {
      response.output = job.returnvalue;
      response.completed_at = new Date(job.finishedOn!).toISOString();
    } else if (state === "failed") {
      response.error = job.failedReason;
    }

    res.json(response);
  } catch (error) {
    console.error("Error getting job status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Express Server

```typescript
// src/server.ts
import express from "express";
import dotenv from "dotenv";
import { router } from "./api/routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api", router);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
```

## Step 2: Job Queue Integration

### Queue Setup

```typescript
// src/queue.ts
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const videoQueue = new Queue("video-generation", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
    },
  },
});

console.log("Job queue initialized");
```

## Step 3: Worker Implementation

### AI Model Integration

```typescript
// src/worker/models.ts
import Replicate from "replicate";
import * as fal from "@fal-ai/serverless-client";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function generateImage(prompt: string): Promise<string> {
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt,
        negative_prompt: "blurry, low quality",
        num_inference_steps: 30,
      },
    },
  );

  return Array.isArray(output) ? output[0] : output;
}

export async function generateVideo(imageUrl: string): Promise<string> {
  const result = await fal.subscribe("fal-ai/fast-svd", {
    input: {
      image_url: imageUrl,
      motion_bucket_id: 127,
      fps: 6,
    },
  });

  return result.video.url;
}

export async function generateAudio(
  text: string,
  duration: number,
): Promise<string> {
  // Simplified - use ElevenLabs or other TTS service
  // For now, return a silent audio track
  return `https://example.com/silent-audio-${duration}s.mp3`;
}
```

### Worker Processor

```typescript
// src/worker/processor.ts
import { Worker, Job } from "bullmq";
import { videoQueue } from "../queue";
import { generateImage, generateVideo, generateAudio } from "./models";
import { uploadToS3 } from "../storage/s3";
import type { StatusResponse } from "../types";

interface JobData {
  prompt: string;
  script?: string;
  webhook_url?: string;
}

const worker = new Worker<JobData>(
  "video-generation",
  async (job: Job<JobData>) => {
    const { prompt, script } = job.data;

    try {
      // Step 1: Generate image (25%)
      await job.updateProgress(10);
      console.log(`[${job.id}] Generating image...`);

      const imageUrl = await generateImage(prompt);

      await job.updateProgress(25);
      console.log(`[${job.id}] Image generated: ${imageUrl}`);

      // Step 2: Generate video (50%)
      await job.updateProgress(30);
      console.log(`[${job.id}] Generating video...`);

      const videoUrl = await generateVideo(imageUrl);

      await job.updateProgress(60);
      console.log(`[${job.id}] Video generated: ${videoUrl}`);

      // Step 3: Download and upload to our storage (80%)
      await job.updateProgress(70);
      console.log(`[${job.id}] Uploading to S3...`);

      const finalVideoUrl = await uploadToS3(videoUrl, `videos/${job.id}.mp4`);

      await job.updateProgress(90);

      // Step 4: Generate thumbnail
      const thumbnailUrl = await generateThumbnail(finalVideoUrl);

      await job.updateProgress(100);

      // Return result
      const output = {
        video_url: finalVideoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: 3.0,
      };

      console.log(`[${job.id}] Complete:`, output);

      // Send webhook if provided
      if (job.data.webhook_url) {
        await sendWebhook(job.data.webhook_url, {
          job_id: job.id as string,
          status: "completed",
          output,
        });
      }

      return output;
    } catch (error) {
      console.error(`[${job.id}] Error:`, error);

      // Send webhook on failure
      if (job.data.webhook_url) {
        await sendWebhook(job.data.webhook_url, {
          job_id: job.id as string,
          status: "failed",
          error: error.message,
        });
      }

      throw error;
    }
  },
  {
    connection: videoQueue.opts.connection,
    concurrency: 5, // Process 5 jobs concurrently
  },
);

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Worker started");

// Webhook helper
async function sendWebhook(url: string, payload: any) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Webhook failed:", error);
  }
}

// Thumbnail helper (simplified)
async function generateThumbnail(videoUrl: string): Promise<string> {
  // In production, extract frame from video
  return videoUrl.replace(".mp4", "-thumb.jpg");
}
```

## Step 4: Storage and Delivery

### S3 Integration

```typescript
// src/storage/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  sourceUrl: string,
  key: string,
): Promise<string> {
  // Download video from source
  const response = await fetch(sourceUrl);
  const buffer = Buffer.from(await response.arrayBuffer());

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "video/mp4",
      ACL: "public-read", // Or use signed URLs for private access
    }),
  );

  // Return public URL
  const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return url;
}
```

## Step 5: Error Handling and Retries

### Retry Configuration

Already configured in `queue.ts`:

- **3 attempts** with exponential backoff
- **5 second** initial delay
- Automatically retries on failure

### Custom Error Types

```typescript
// src/types.ts
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

// In worker/processor.ts
try {
  const imageUrl = await generateImage(prompt);
} catch (error) {
  if (error.status === 429) {
    throw new RateLimitError("Rate limit exceeded");
  } else if (error.status === 400) {
    throw new InvalidInputError("Invalid prompt");
  }
  throw error;
}
```

## Testing the API

### Start Services

```bash
# Terminal 1: Start Redis
docker run -p 6379:6379 redis

# Terminal 2: Start API server
npm run dev:server

# Terminal 3: Start worker
npm run dev:worker
```

### Test Requests

```bash
# Create a video generation job
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cat in space",
    "script": "This is a cat floating in space"
  }'

# Response:
# {
#   "job_id": "1234",
#   "status": "queued",
#   "estimated_time_seconds": 120
# }

# Check status
curl http://localhost:3000/api/status/1234

# Response (processing):
# {
#   "job_id": "1234",
#   "status": "processing",
#   "progress": 45,
#   "created_at": "2025-01-01T00:00:00Z"
# }

# Response (completed):
# {
#   "job_id": "1234",
#   "status": "completed",
#   "progress": 100,
#   "output": {
#     "video_url": "https://...",
#     "thumbnail_url": "https://...",
#     "duration_seconds": 3.0
#   },
#   "created_at": "2025-01-01T00:00:00Z",
#   "completed_at": "2025-01-01T00:02:15Z"
# }
```

## Production Enhancements

### 1. Rate Limiting (Per User)

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: "Too many requests, please try again later",
});

router.post("/generate", limiter, async (req, res) => {
  // ...
});
```

### 2. Authentication

```typescript
function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.userId = getUserIdFromApiKey(apiKey);
  next();
}

router.post("/generate", authenticate, async (req, res) => {
  // Track usage per user
  await trackUsage(req.userId, "video_generation");
  // ...
});
```

### 3. Cost Tracking

```typescript
// In worker
const cost = 0.1 + 0.5 + 0.05; // Image + video + audio

await db.usage.create({
  userId: job.data.userId,
  jobId: job.id,
  cost,
  createdAt: new Date(),
});
```

### 4. Webhook Signatures

```typescript
import crypto from "crypto";

function signWebhook(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

const body = JSON.stringify(payload);
const signature = signWebhook(body, process.env.WEBHOOK_SECRET!);

await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Signature": signature,
  },
  body,
});
```

## Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    command: npm run start:server
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - redis

  worker:
    build: .
    command: npm run start:worker
    env_file: .env
    depends_on:
      - redis
    deploy:
      replicas: 3
```

### Deploy to Cloud

**Options:**

- **Fly.io** - Easy deployment, scales automatically
- **Railway** - Simple setup, built-in Redis
- **AWS ECS** - Full control, more complex
- **Render** - Simple, auto-scaling

## Conclusion

You've built a production-ready video generation API with:

- **REST endpoints** for creating jobs and checking status
- **Job queue** for async processing
- **Worker** that orchestrates AI models
- **Storage** for generated videos
- **Error handling** and retries
- **Webhooks** for notifications

**Next steps:**

- Add authentication and rate limiting
- Implement cost tracking per user
- Add more video generation options (resolution, style, etc.)
- Build a client SDK for easy integration
- Add analytics and monitoring

**Want to skip building all this infrastructure?** Check out [Synthome](https://synthome.ai)—it provides a ready-made API for AI video generation with built-in orchestration, storage, and webhooks.

The code from this tutorial is available at: `github.com/yourrepo/video-gen-api`
