# @synthome/sdk

TypeScript SDK for the Synthome Video API - Composable AI Media Toolkit for Replicate, Fal, and Google Cloud.

## Installation

```bash
npm install @synthome/sdk
# or
yarn add @synthome/sdk
# or
pnpm add @synthome/sdk
# or
bun add @synthome/sdk
```

## Getting Started

### 1. Get Your Synthome API Key

Sign up and get your API key from the Synthome dashboard:

👉 **[https://synthome.dev](https://synthome.dev)**

Once logged in, navigate to your dashboard to create and manage your API keys.

### 2. Configure Provider API Keys

Synthome orchestrates jobs across multiple AI providers (Replicate, Fal, ElevenLabs, Hume, etc.). **You need to provide your own API keys for these providers.**

**Three ways to configure provider API keys:**

#### Option 1: Dashboard (Recommended)

Add your provider API keys in the Synthome dashboard at [https://synthome.dev](https://synthome.dev). This allows you to manage all keys in one place.

#### Option 2: Environment Variables

```bash
export REPLICATE_API_KEY="your-replicate-key"
export ELEVENLABS_API_KEY="your-elevenlabs-key"
export HUME_API_KEY="your-hume-key"
export FAL_KEY="your-fal-key"
# ... other provider keys
```

#### Option 3: Pass Directly in Code

```typescript
const execution = await compose(
  generateAudio({
    model: elevenlabs("elevenlabs/turbo-v2.5", {
      apiKey: "your-elevenlabs-api-key", // Pass provider key directly
    }),
    text: "Hello world",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  }),
).execute({
  apiKey: "your-synthome-api-key",
});
```

> **Priority Order**: Model-level API key → Dashboard keys → Environment variables

### 3. Quick Start

```typescript
import { compose, generateVideo, replicate } from "@synthome/sdk";

// Set your Synthome API key
process.env.SYNTHOME_API_KEY = "your-synthome-api-key";

// Set provider API keys (if not configured in dashboard)
process.env.REPLICATE_API_KEY = "your-replicate-api-key";

// Generate a video
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A serene landscape with mountains",
    duration: 5,
  }),
).execute();

console.log("Video URL:", execution.result?.url);
```

## Configuration

### Required API Keys

1. **Synthome API Key** (required for all requests)
   - Get from [https://synthome.dev](https://synthome.dev)
   - Used for: Authenticating with Synthome's orchestration service

2. **Provider API Keys** (required for each provider you use)
   - Configure via: Dashboard, environment variables, or code
   - Examples:
     - `REPLICATE_API_KEY` - For Replicate models
     - `ELEVENLABS_API_KEY` - For ElevenLabs audio
     - `HUME_API_KEY` - For Hume TTS
     - `FAL_KEY` - For Fal models
     - `GOOGLE_CLOUD_PROJECT` - For Google Cloud models

### Passing API Keys

You can pass your Synthome API key directly:

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A serene landscape",
  }),
).execute({
  apiKey: "your-synthome-api-key",
});
```

### Error Messages

If a provider API key is missing, you'll see a helpful error message:

```
Please configure your [Provider] API key in the dashboard or export [PROVIDER]_API_KEY in your environment
```

Examples:

- `Please configure your Replicate API key in the dashboard or export REPLICATE_API_KEY in your environment`
- `Please configure your ElevenLabs API key in the dashboard or export ELEVENLABS_API_KEY in your environment`

## Features

- **Multiple Providers**: Support for Replicate, Fal, and Google Cloud models
- **Video Generation**: Generate videos from text prompts
- **Image Generation**: Create images from text prompts
- **Audio Generation**: Generate audio/speech
- **Video Operations**: Merge, reframe, add subtitles, remove backgrounds
- **Composable Pipelines**: Chain multiple operations together
- **Webhook Support**: Receive notifications when jobs complete
- **TypeScript**: Full type safety and autocomplete

## Examples

### Generate Multiple Scenes

```typescript
import { compose, generateVideo, merge, replicate } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 1: A sunrise over mountains",
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 2: A peaceful lake",
  }),
  merge({ transition: "fade" }),
).execute();
```

### With Webhooks

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A futuristic cityscape",
  }),
).execute({
  webhook: "https://your-domain.com/webhook",
  webhookSecret: "your-secret",
});
```

### Progress Tracking

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A peaceful forest",
  }),
)
  .onProgress((progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Current job: ${progress.currentJob}`);
  })
  .execute();
```

## License

MIT
