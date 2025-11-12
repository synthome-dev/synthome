# Provider API Keys - Usage Guide

## Overview

The SDK now supports client-provided provider API keys (Replicate, FAL, Google Cloud). This means:

- **Clients pay for their own usage** (not you!)
- Provider API keys can be passed explicitly or read from environment variables
- Backward compatible - falls back to server keys if client doesn't provide them

## How It Works

### 1. Automatic Environment Variable Detection

The SDK automatically reads provider API keys from these environment variables:

```bash
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GOOGLE_CLOUD_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

When you call `pipeline.execute()`, it automatically picks up these keys:

```typescript
import { compose, generate } from "@repo/ai-video-sdk";

// Provider keys are automatically read from environment variables
const pipeline = compose(
  generate({
    modelId: "fal-ai/kling-video/v1/standard/image-to-video",
    prompt: "A cat walking",
    image: "https://example.com/cat.jpg",
  }),
);

await pipeline.execute({
  apiKey: "sy_xxxxx", // Your Synthome API key
  // providerApiKeys are automatically read from env
});
```

### 2. Explicit Provider Keys

You can also pass provider API keys explicitly (overrides environment variables):

```typescript
await pipeline.execute({
  apiKey: "sy_xxxxx",
  providerApiKeys: {
    replicate: "r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    fal: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "google-cloud": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
});
```

### 3. Mixed Approach

You can set some keys in environment variables and override specific ones:

```bash
# .env
REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

```typescript
await pipeline.execute({
  apiKey: "sy_xxxxx",
  providerApiKeys: {
    // Use Replicate & FAL from env, but override Google Cloud
    "google-cloud": "custom-key-for-this-execution",
  },
});
```

## Priority Order

The SDK resolves provider API keys in this order:

1. **Explicitly provided** in `config.providerApiKeys` (highest priority)
2. **Environment variables** (REPLICATE_API_KEY, FAL_KEY, GOOGLE_CLOUD_API_KEY)
3. **Server fallback** - Uses backend's environment variables (for backward compatibility)

## Security Notes

- Provider API keys are stored in the execution record in the database
- Keys are sent to the backend via HTTPS
- Consider encrypting provider keys in the database for production use
- The server's provider keys (in backend env vars) are only used as fallback
- **Optimized security**: The SDK automatically analyzes your execution plan and only sends API keys for providers that are actually used in your pipeline (e.g., if your pipeline only uses Replicate models, only the Replicate API key is sent, even if you have FAL and Google Cloud keys in your environment)

## Testing

To verify client keys are being used:

1. Create a test provider account (Replicate/FAL)
2. Set the test API key in your environment:
   ```bash
   export REPLICATE_API_KEY=r8_test_xxxxxxxxxxxxx
   ```
3. Run an execution and check the test account's usage dashboard
4. Verify the request appears in your test account (not the server's account)

## Example: Full Workflow

```typescript
import { compose, generate } from "@repo/ai-video-sdk";

// Set provider keys in environment
// REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// SYNTHOME_API_KEY=sy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const pipeline = compose(
  generate({
    modelId: "minimax/video-01",
    prompt: "A serene lake at sunset",
  }),
);

// Execute - provider keys automatically picked up from env
const execution = await pipeline.execute();
const result = await execution.waitForCompletion();

console.log("Video URL:", result.url);
```

## Migration from Old API

If you were using the old `generateVideo()` API, it already had this behavior:

```typescript
// Old API (still works)
import { generateVideo, models } from "@repo/ai-video-sdk";

const job = await generateVideo({
  model: models.fal.kling.imageToVideo({
    apiKey: "fal_xxxxx", // or from FAL_KEY env var
  }),
  prompt: "A cat walking",
  image: "https://example.com/cat.jpg",
});
```

The new pipeline API now has the same automatic environment variable detection!
