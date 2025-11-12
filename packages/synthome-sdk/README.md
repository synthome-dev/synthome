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

## Quick Start

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

### Passing Options

You can also pass configuration directly:

```typescript
const execution = await compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A serene landscape",
  }),
).execute({
  apiKey: "your-api-key"
});
```

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
