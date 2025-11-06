# Step 20: API Documentation

## Overview

Create comprehensive API documentation and deployment guide.

## Files to Create

- `apps/be/README.md`
- `docs/API.md`
- `docs/DEPLOYMENT.md`

## API Documentation

### docs/API.md

```markdown
# Open Video API Documentation

## Base URL

- Development: `http://localhost:3000`
- Production: `https://api.openvideo.dev`

## Authentication

Currently no authentication required (add API keys in production).

## Endpoints

### POST /api/execute

Create a new video pipeline execution.

**Request:**
\`\`\`json
{
"executionPlan": {
"jobs": [
{
"id": "job1",
"operation": "generateVideo",
"params": {
"provider": "replicate",
"model": "minimax/video-01",
"prompt": "A cat playing piano"
}
}
],
"rootJobIds": ["job1"]
},
"options": {
"baseExecutionId": "optional-base-id",
"webhookUrl": "https://example.com/webhook",
"webhookSecret": "secret"
}
}
\`\`\`

**Response (202):**
\`\`\`json
{
"id": "exec_abc123",
"status": "pending",
"createdAt": "2025-01-15T10:30:00Z"
}
\`\`\`

### GET /api/execute/:id/status

Get execution status and results.

**Response (200):**
\`\`\`json
{
"id": "exec_abc123",
"status": "completed",
"jobs": [
{
"id": "job1",
"operation": "generateVideo",
"status": "completed",
"result": {
"url": "https://s3.../video.mp4"
}
}
],
"result": {
"url": "https://s3.../video.mp4"
},
"createdAt": "2025-01-15T10:30:00Z",
"completedAt": "2025-01-15T10:35:00Z"
}
\`\`\`

### POST /api/execute/:id/retry

Retry failed execution.

### DELETE /api/execute/:id/cache

Invalidate cache for execution.

## Webhook Payload

When execution completes, POST to webhook URL:

\`\`\`json
{
"executionId": "exec_abc123",
"status": "completed",
"outputs": {
"job1": {
"url": "https://s3.../video.mp4",
"operation": "generateVideo"
}
},
"rootUrl": "https://s3.../video.mp4",
"createdAt": "2025-01-15T10:30:00Z",
"completedAt": "2025-01-15T10:35:00Z"
}
\`\`\`

**Headers:**

- `X-Webhook-Signature`: HMAC SHA256 signature if secret provided

## Rate Limits

- 100 requests per minute per IP
- Provider-specific limits apply

## Error Codes

- `400` - Validation error
- `404` - Execution not found
- `429` - Rate limit exceeded
- `500` - Internal server error
```

## Deployment Guide

### docs/DEPLOYMENT.md

```markdown
# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- AWS S3 bucket
- Provider API keys (Replicate, Fal, Google Cloud)

## Environment Variables

\`\`\`bash

# Database

DATABASE_URL=postgresql://user:pass@host:5432/openvideo

# Redis

REDIS_URL=redis://localhost:6379

# Storage

S3_BUCKET=openvideo-videos
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Providers

REPLICATE_API_KEY=...
FAL_KEY=...
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_CREDENTIALS=...

# Services

FFMPEG_API_URL=http://ffmpeg:3001
BROWSER_WS_ENDPOINT=ws://browserless:3000

# API

PORT=3000
LOG_LEVEL=info
\`\`\`

## Database Setup

\`\`\`bash

# Run migrations

bun run db:migrate

# Seed if needed

bun run db:seed
\`\`\`

## Running Services

### Development

\`\`\`bash
bun install
bun run dev
\`\`\`

### Production (Docker)

\`\`\`bash
docker-compose up -d
\`\`\`

## Docker Compose

\`\`\`yaml
version: '3.8'
services:
api:
build: ./apps/be
environment: - DATABASE_URL=postgresql://postgres:password@db:5432/openvideo - REDIS_URL=redis://redis:6379
depends_on: - db - redis - ffmpeg
ports: - "3000:3000"

ffmpeg:
build: ./apps/ffmpeg
ports: - "3001:3001"

db:
image: postgres:15
environment:
POSTGRES_DB: openvideo
POSTGRES_PASSWORD: password
volumes: - postgres-data:/var/lib/postgresql/data

redis:
image: redis:7
volumes: - redis-data:/data

volumes:
postgres-data:
redis-data:
\`\`\`

## Monitoring

- Logs: `docker-compose logs -f api`
- Metrics: Available at `/metrics`
- Health: `curl http://localhost:3000/health`

## Scaling

For high throughput, scale workers:
\`\`\`bash
docker-compose up -d --scale worker=5
\`\`\`
```

## Completion Criteria

- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Docker compose file created
- [ ] Environment variables documented
- [ ] Health check endpoint added
