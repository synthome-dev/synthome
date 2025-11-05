# Async Video Generation - Setup & Testing Guide

## Overview

This system implements asynchronous video generation with two completion strategies:

- **Webhook-based**: Providers send HTTP callbacks when jobs complete
- **Polling-based**: Worker polls provider APIs to check job status

## Architecture

```
Client → Backend API → Job Queue → Provider API
                           ↓
                    (Async Processing)
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                                     ↓
  Webhook Handler                    Polling Worker
  (HTTP callback)                   (Status checks)
        ↓                                     ↓
        └──────────────────┬──────────────────┘
                           ↓
                  Async Job Completion
                  (Download → CDN Upload → DB Update)
                           ↓
                  Trigger Dependent Jobs
```

## Prerequisites

### 1. Database Setup

The async tracking columns must exist in the `execution_jobs` table:

```sql
-- Migration 0004_add_async_job_tracking.sql
ALTER TABLE execution_jobs
ADD COLUMN provider_job_id TEXT,
ADD COLUMN provider_job_status TEXT,
ADD COLUMN waiting_strategy TEXT,
ADD COLUMN next_poll_at TIMESTAMP,
ADD COLUMN poll_attempts INTEGER DEFAULT 0;
```

Verify the schema:

```bash
cd packages/db
bun run drizzle-kit push
```

### 2. Environment Variables

#### Backend (`apps/be/.env`)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Storage (Cloudflare R2 or S3)
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_URL=https://your-bucket.r2.cloudflarestorage.com

# API Base URL (must be publicly accessible for webhooks)
API_BASE_URL=https://your-domain.com  # or use ngrok for local testing

# Provider API Keys
REPLICATE_API_TOKEN=your_replicate_token  # For webhook testing
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key  # For polling testing
FAL_KEY=your_fal_key  # Optional
```

#### Schedule Worker (`apps/schedule-worker/.env`)

```bash
# Same as backend
DATABASE_URL=postgresql://user:password@host:port/database
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_URL=https://your-bucket.r2.cloudflarestorage.com

# Provider API Keys
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
REPLICATE_API_TOKEN=your_replicate_token
FAL_KEY=your_fal_key
```

### 3. Provider Webhook Configuration

For webhook-enabled providers (Replicate, FAL), you need to configure the webhook URL in their dashboards:

**Replicate:**

- Webhooks are configured per-request (no dashboard setup needed)
- The system automatically includes webhook URL when starting generation

**FAL:**

- Webhooks are configured per-request
- System automatically includes webhook URL

### 4. Local Development with Webhooks

For local testing of webhooks, use ngrok to expose your local backend:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Expose local backend
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Set API_BASE_URL to this URL
```

Update `apps/be/.env`:

```bash
API_BASE_URL=https://abc123.ngrok-free.app
```

## Running the System

### 1. Start the Backend

```bash
cd apps/be
bun run dev
```

The backend will start on `http://localhost:3000` and expose:

- `POST /api/execute` - Submit execution
- `GET /api/status/:executionId` - Check status
- `POST /api/webhooks/job/:jobRecordId` - Webhook handler

### 2. Start the Schedule Worker

```bash
cd apps/schedule-worker
bun run dev
```

The worker will:

- Start the PGBoss job queue
- Start the polling worker (checks every 10 seconds)
- Process queued jobs

Expected output:

```
📅 Starting Schedule Worker...
✅ PGBoss job system started
✅ Polling worker started
✅ Schedule Worker is running
```

## Testing

### Test 1: Webhook Flow

Tests the webhook-based completion using Replicate:

```bash
bun run test-webhook-flow.ts
```

This will:

1. Submit execution with `bytedance/seedance-1-pro` model
2. Wait for Replicate to send webhook
3. Verify job completion and CDN upload
4. Check final status

Expected timeline:

- Job submitted: ~1s
- Provider starts generation: ~2-5s
- Generation completes: ~30-120s (varies by model)
- Webhook received: ~1s after completion
- CDN upload: ~5-10s
- Total: 1-3 minutes

### Test 2: Polling Flow

Tests the polling-based completion using Google Cloud:

```bash
bun run test-polling-flow.ts
```

This will:

1. Submit execution with Google Cloud model
2. Monitor polling worker activity
3. Verify exponential backoff
4. Check job completion via polling
5. Verify CDN upload

Expected timeline:

- Job submitted: ~1s
- First poll: ~5s after submission
- Subsequent polls: 5s, 7.5s, 11.25s... (exponential backoff)
- Generation completes: varies by provider
- Total: 2-5 minutes

### Manual Testing

You can also test manually using curl:

```bash
# Submit execution (webhook-based)
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "executionPlan": {
      "jobs": [{
        "id": "test-gen",
        "operation": "pipeline:generate",
        "params": {
          "modelId": "bytedance/seedance-1-pro",
          "prompt": "A beautiful sunset over mountains"
        }
      }]
    }
  }'

# Check status
curl http://localhost:3000/api/status/EXECUTION_ID
```

## Monitoring

### Backend Logs

Watch for webhook events:

```bash
cd apps/be
bun run dev

# Look for:
[Webhook] Received webhook for job xxx, model xxx
[AsyncJobCompletion] Completing job xxx with N outputs
[AsyncJobCompletion] Uploaded to CDN: https://...
[AsyncJobCompletion] Job xxx marked as completed
```

### Schedule Worker Logs

Watch for polling activity:

```bash
cd apps/schedule-worker
bun run dev

# Look for:
[PollingWorker] Found N jobs to poll
[PollingWorker] Polling job xxx (attempt N)
[PollingWorker] Job xxx status: processing
[PollingWorker] Job xxx still processing, next poll at...
[AsyncJobCompletion] Completing job xxx with N outputs
```

### Database Queries

Check job status in real-time:

```sql
-- View all processing jobs
SELECT
  id,
  job_id,
  status,
  provider_job_id,
  waiting_strategy,
  poll_attempts,
  next_poll_at,
  created_at
FROM execution_jobs
WHERE status = 'processing'
ORDER BY created_at DESC;

-- View completed jobs
SELECT
  id,
  job_id,
  status,
  waiting_strategy,
  result->>'completedAt' as completed_at,
  (completed_at - created_at) as duration
FROM execution_jobs
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Webhooks Not Being Received

1. Check `API_BASE_URL` is set correctly
2. Verify URL is publicly accessible (test with curl from external network)
3. Check provider dashboard for webhook delivery logs
4. Look for webhook errors in backend logs
5. For local dev, ensure ngrok is running

### Polling Not Working

1. Verify schedule worker is running
2. Check `waiting_strategy` is set to `"polling"` in database
3. Verify `next_poll_at` is in the past
4. Check provider API credentials
5. Look for errors in polling worker logs

### Job Stuck in Processing

1. Check job status in database
2. Look for errors in both backend and worker logs
3. Verify provider job status manually via provider API
4. Check if max poll attempts exceeded (100 by default)
5. Verify network connectivity to provider and CDN

### CDN Upload Failing

1. Check S3 credentials are correct
2. Verify S3 bucket exists and is accessible
3. Check storage URL format
4. Test download from provider URL manually
5. Check storage service logs

### Job Fails Immediately

1. Check provider API key is valid
2. Verify model ID is correct
3. Check input parameters match model schema
4. Look for validation errors in logs
5. Test provider API directly

## Configuration

### Polling Worker Settings

Edit `apps/schedule-worker/src/index.ts`:

```typescript
const pollingWorker = new PollingWorker({
  intervalMs: 10000, // Check for jobs every 10s
  maxPollAttempts: 100, // Max 100 polls before giving up
  backoffMultiplier: 1.5, // 1.5x backoff each attempt
  initialBackoffMs: 5000, // Start with 5s between polls
});
```

### Webhook Timeout

Webhooks have no timeout - they're triggered by the provider when ready.

### Provider Selection

Models are configured in `packages/model-schemas/src/registry.ts`:

```typescript
export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    capabilities: replicateCapabilities, // webhook + polling
  },
  // Add more models here
};
```

## Next Steps

1. **Add More Models**: Register additional models in the model registry
2. **Implement Provider Methods**: Complete Google Cloud and FAL async implementations
3. **Add Monitoring**: Set up observability (Sentry, Datadog, etc.)
4. **Error Recovery**: Implement retry logic for transient failures
5. **Webhook Security**: Add webhook signature validation
6. **Rate Limiting**: Implement rate limits for polling
7. **Job Cleanup**: Add cleanup for old completed/failed jobs
8. **Multi-region**: Deploy workers in multiple regions for reliability

## Reference

### File Locations

- **Webhook Handler**: `apps/be/src/routes/webhooks.ts`
- **Polling Worker**: `apps/schedule-worker/src/polling-worker.ts`
- **Async Completion**: `packages/jobs/src/utils/async-job-completion.ts`
- **Generate Job**: `packages/jobs/src/jobs/pipeline/generate-video.ts`
- **Provider Services**: `packages/providers/src/services/*-service.ts`
- **Model Registry**: `packages/model-schemas/src/registry.ts`
- **Database Schema**: `packages/db/src/db/schema.ts`

### API Endpoints

- `POST /api/execute` - Submit execution plan
- `GET /api/status/:executionId` - Get execution status
- `POST /api/webhooks/job/:jobRecordId` - Provider webhook callback

### Database Tables

- `executions` - Execution records
- `execution_jobs` - Individual job records with async tracking
