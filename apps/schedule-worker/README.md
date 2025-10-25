# Schedule Worker

Background worker that handles scheduled posting of campaign videos to social media platforms and collects performance metrics.

## Features

### Video Posting (runs every 5 minutes)

- Checks for videos with `status = 'scheduled'` and `scheduledAt <= now()`
- Posts approved videos to TikTok (currently supported)
- Handles OAuth token refresh automatically
- Updates video status after posting
- Error handling with status tracking

### Metrics Collection (runs every 15 minutes)

- Collects performance metrics for posted videos
- Smart tiered collection frequency based on video age:
  - 0-24 hours: Every hour
  - 1-3 days: Every 6 hours
  - 3-7 days: Every 12 hours
  - 7-14 days: Every 24 hours
  - 14-30 days: Every 3 days
  - 30+ days: Stops collecting
- Rate limiting to prevent API throttling (max 100 requests/minute)
- Batch processing with concurrency control
- Stores metrics in `videoPerformance` table

## Setup

1. Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Run the worker:
   ```bash
   bun run dev  # Development mode with auto-reload
   bun run start  # Production mode
   ```

## How it works

1. Every 5 minutes, the worker queries the database for videos with:

   - `status = 'scheduled'`
   - `scheduledAt <= now()`
   - Connected TikTok account

2. For each video found:
   - Refreshes OAuth tokens if expired
   - Posts the video to TikTok
   - Updates status to 'posted' on success
   - Updates status to 'failed' on error

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `TZ` - Timezone for scheduling (default: UTC)

## Monitoring

The worker logs all activities with prefixes:

- `[Schedule Worker]` - Worker lifecycle events
- `[PostVideos]` - Video posting job activities
- `[Scheduler]` - Cron job execution
