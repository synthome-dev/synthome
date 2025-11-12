# Composable Video Pipeline

This package provides a composable API for creating complex video workflows with lazy execution, dependency management, and webhook support.

## Basic Usage

### Simple Video Generation with Effects

```typescript
import {
  compose,
  generateVideo,
  replicate,
  reframe,
  addSubtitles,
} from "@repo/ai-video-sdk";

const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "A skier glides over snow",
    duration: 5,
    aspectRatio: "16:9",
  }),
  reframe({ aspectRatio: "9:16" }),
  addSubtitles({ language: "en" }),
);

const execution = await pipeline.execute({ apiKey: "..." });

execution.onComplete((video) => {
  console.log(`Video ready: ${video.url}`);
});
```

### Multiple Scenes with Merge

```typescript
import {
  compose,
  generateVideo,
  merge,
  lipSync,
  replicate,
} from "@repo/ai-video-sdk";

const pipeline = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 1: Mountain landscape",
    duration: 5,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 2: Skier on slope",
    duration: 5,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Scene 3: Sunset over mountains",
    duration: 5,
  }),
  merge({ transition: "crossfade" }),
  lipSync({ audioUrl: "https://example.com/audio.mp3" }),
);

const execution = await pipeline.execute();
```

### Pipeline Reuse with Dependencies

Create a base pipeline, then extend it with multiple variants. The backend will ensure variants wait for the base to complete:

```typescript
import {
  compose,
  generateVideo,
  merge,
  lipSync,
  addSubtitles,
  replicate,
} from "@repo/ai-video-sdk";

// Create base product demo
const productDemo = compose(
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Product showcase scene 1",
    duration: 3,
  }),
  generateVideo({
    model: replicate("bytedance/seedance-1-pro"),
    prompt: "Product showcase scene 2",
    duration: 3,
  }),
  merge({ transition: "crossfade" }),
);

// Execute base (no webhook, just start it)
const baseExecution = await productDemo.execute();

// Create variants that depend on base execution
const frenchExecution = await compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/french.mp3" }),
  addSubtitles({ language: "fr" }),
).execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://api.example.com/webhook/french",
  webhookSecret: "secret123",
});

const spanishExecution = await compose(
  productDemo,
  lipSync({ audioUrl: "https://example.com/spanish.mp3" }),
  addSubtitles({ language: "es" }),
).execute({
  baseExecutionId: baseExecution.id,
  webhookUrl: "https://api.example.com/webhook/spanish",
});

// Backend will:
// 1. Execute base pipeline first
// 2. Wait for base to complete
// 3. Execute French & Spanish in parallel
// 4. Send webhooks when each variant completes
```

### Webhook vs Polling

**Webhook (Recommended for production):**

```typescript
const execution = await pipeline.execute({
  webhookUrl: "https://api.example.com/webhook/video-complete",
  webhookSecret: "your-secret",
});

// Backend will POST to webhook when complete:
// {
//   "executionId": "exec_123",
//   "status": "completed",
//   "video": {
//     "url": "https://...",
//     "duration": 15,
//     "aspectRatio": "16:9"
//   }
// }
```

**Polling (Good for development):**

```typescript
const execution = await pipeline.execute(); // No webhook = auto-poll

execution.onComplete((video) => {
  console.log(`Video ready: ${video.url}`);
});

// Or track progress
pipeline.onProgress((progress) => {
  console.log(`${progress.completedJobs}/${progress.totalJobs} jobs done`);
});
```

### Branching - Create Multiple Variations

```typescript
import { compose, generateVideo, reframe, replicate } from "@repo/ai-video-sdk";

const base = generateVideo({
  model: replicate("bytedance/seedance-1-pro"),
  prompt: "A beautiful landscape",
  duration: 5,
  aspectRatio: "16:9",
});

const vertical = compose(base, reframe({ aspectRatio: "9:16" }));
const square = compose(base, reframe({ aspectRatio: "1:1" }));

const verticalExecution = await vertical.execute();
const squareExecution = await square.execute();
```

### Using Existing Videos

```typescript
import { compose, video, reframe, addSubtitles } from "@repo/ai-video-sdk";

const existingVideo = video({
  url: "https://example.com/video.mp4",
  duration: 10,
  aspectRatio: "16:9",
});

const pipeline = compose(
  existingVideo,
  reframe({ aspectRatio: "9:16" }),
  addSubtitles(),
);

const execution = await pipeline.execute();
```

## How It Works

### Lazy Execution

All operations are lazy - they build an execution plan (JSON) that gets sent to the backend:

```typescript
const pipeline = compose(
  generateVideo({
    /* ... */
  }),
  reframe({ aspectRatio: "9:16" }),
);

const plan = pipeline.toJSON();
console.log(plan);
```

Output:

```json
{
  "jobs": [
    {
      "id": "job1",
      "type": "generate",
      "params": { "provider": "replicate", "modelId": "...", "prompt": "..." },
      "output": "$job1"
    },
    {
      "id": "job2",
      "type": "reframe",
      "params": { "aspectRatio": "9:16" },
      "dependsOn": ["job1"],
      "output": "$job2"
    }
  ]
}
```

### Execution with Dependencies

When using `baseExecutionId`, the JSON includes the dependency:

```json
{
  "jobs": [
    {
      "id": "job1",
      "type": "lipSync",
      "params": { "audioUrl": "https://..." },
      "output": "$job1"
    }
  ],
  "baseExecutionId": "exec_abc123",
  "webhook": {
    "url": "https://api.example.com/webhook",
    "secret": "secret123"
  }
}
```

The backend will:

1. Look up base execution `exec_abc123`
2. Create new jobs that depend on base execution's final job
3. Execute when base completes
4. Send webhook when variant completes

### Backend Execution

When you call `.execute()`:

1. The execution plan is sent to the backend API
2. Backend creates PgBoss jobs for each step
3. Jobs execute sequentially or in parallel based on dependencies
4. SDK either:
   - **Polls** for completion with progress updates (no webhook)
   - **Returns immediately** and backend sends webhook (with webhook)

## Available Operations

- `generateVideo()` - Generate video from text/image
- `merge()` - Combine multiple videos with transitions
- `reframe()` - Change aspect ratio
- `lipSync()` - Add lip-sync audio
- `addSubtitles()` - Add subtitles/captions
- `video()` - Import existing video URL

## API

### `compose(...nodes: VideoNode[]): Pipeline`

Creates a composable pipeline from video nodes (operations or videos).

### `Pipeline`

- `.toJSON(): ExecutionPlan` - Get the execution plan as JSON
- `.execute(config?): Promise<PipelineExecution>` - Execute the pipeline
- `.onProgress(callback): Pipeline` - Subscribe to progress updates
- `.getOperations(): VideoOperation[]` - Get operations for reuse

### `ExecuteOptions`

```typescript
interface ExecuteOptions {
  apiKey?: string;
  apiUrl?: string;
  baseExecutionId?: string; // Reference parent execution
  webhookUrl?: string; // Webhook endpoint
  webhookSecret?: string; // Webhook HMAC secret
}
```

### `PipelineExecution`

```typescript
interface PipelineExecution {
  id: string; // Execution ID
  status: "pending" | "processing" | "completed" | "failed";
  onComplete(callback: (video: Video) => void): void;
}
```

### `Video`

```typescript
interface Video {
  url: string;
  status: "pending" | "processing" | "completed" | "failed";
  aspectRatio: string;
  duration: number;
}
```
