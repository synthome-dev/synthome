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

### 1. Get Your API Key

Sign up and get your API key from the Synthome dashboard:

**[https://synthome.dev](https://synthome.dev)**

Once logged in, navigate to your dashboard to create and manage your API keys.

### 2. Quick Start

```typescript
import { compose, generateVideo, replicate } from "@synthome/sdk";

// Set your API key
process.env.SYNTHOME_API_KEY = "your-api-key";

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

### Environment Variables

- `SYNTHOME_API_KEY` - Your Synthome API key (required)
  - Get your API key from [https://synthome.dev](https://synthome.dev)

### Passing API Key Directly

You can also pass your API key directly in the code:

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A serene landscape",
  }),
).execute({
  apiKey: "your-api-key", // Your API key from https://synthome.dev
});
```

### Provider-Specific API Keys

If you want to use your own provider API keys (Replicate, ElevenLabs, Hume, etc.) instead of Synthome's managed keys, you can configure them in your dashboard at [https://synthome.dev](https://synthome.dev) or pass them directly:

```typescript
// Option 1: Configure in dashboard (recommended)
// Go to https://synthome.dev and add your provider API keys

// Option 2: Pass directly in the model config
const execution = await compose(
  generateAudio({
    model: elevenlabs("elevenlabs/turbo-v2.5", {
      apiKey: "your-elevenlabs-api-key", // Optional: use your own key
    }),
    text: "Hello world",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  }),
).execute({
  apiKey: "your-synthome-api-key",
});
```

> **Note**: If you don't provide provider-specific API keys, the error message will guide you:
>
> ```
> Please configure your [Provider] API key in the dashboard or export [PROVIDER]_API_KEY in your environment
> ```

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
