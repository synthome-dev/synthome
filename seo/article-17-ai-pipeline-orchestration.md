# A Developer's Guide to Orchestrating Multi-Model AI Pipelines

Running one AI model is easy. Send a request, get a response, done.

Running **ten models in sequence**, where each depends on the previous output, failures can happen at any step, and some steps need to run in parallel?

That's orchestration. And it's hard.

This guide covers how to coordinate multi-model AI workflows: managing dependencies, handling failures, tracking state, and building pipelines that actually work in production.

## What Is Pipeline Orchestration?

**Orchestration** is the layer that coordinates multiple AI model executions into a cohesive workflow.

### A Simple Pipeline

```typescript
// Sequential: each step depends on the previous
const image = await generateImage(prompt);
const video = await imageToVideo(image);
const audio = await generateAudio(script);
const final = await mergeVideoAudio(video, audio);
```

This looks simple, but consider:

- What if `generateImage` takes 30 seconds and times out?
- What if `imageToVideo` fails halfway through?
- What if you need to restart from `generateAudio` without re-running everything?
- How do you track progress for the user?
- How do you ensure only one pipeline runs at a time per user?

**Orchestration solves these problems.**

### Orchestration vs Execution

| **Execution**           | **Orchestration**                |
| ----------------------- | -------------------------------- |
| Running a single model  | Coordinating multiple models     |
| HTTP request → response | Dependency management            |
| Retrying one call       | Recovering from partial failures |
| Single status           | Multi-step state tracking        |

**Execution** is what your HTTP client does. **Orchestration** is what your application logic does.

## Core Orchestration Challenges

### 1. Dependency Management

Models often depend on each other's outputs:

```typescript
// Video generation depends on image
const image = await generateImage(prompt);
const video = await generateVideo({ image }); // Needs image URL

// Captions depend on audio
const audio = await extractAudio(video);
const captions = await transcribeAudio(audio); // Needs audio file

// Final video depends on everything
const final = await addCaptions(video, captions);
```

**The challenge:** If any step fails, you need to know which steps can be retried independently.

### 2. State Tracking

Each step in a pipeline has a status:

```typescript
{
  "pipeline_id": "abc123",
  "steps": [
    { "id": "generate_image", "status": "completed", "output": "https://..." },
    { "id": "generate_video", "status": "processing", "output": null },
    { "id": "generate_audio", "status": "pending", "output": null },
    { "id": "merge", "status": "pending", "output": null }
  ]
}
```

**The challenge:** You need to persist this state so you can resume after failures.

### 3. Error Recovery

When a step fails, you need to decide:

- Retry the failed step?
- Restart from the beginning?
- Skip the step and continue?
- Fail the entire pipeline?

```typescript
try {
  const video = await generateVideo(image);
} catch (error) {
  if (error.code === "TIMEOUT") {
    // Retry with longer timeout
    return await generateVideo(image, { timeout: 120000 });
  } else if (error.code === "INVALID_INPUT") {
    // Can't recover, fail pipeline
    throw error;
  } else {
    // Transient error, retry after delay
    await sleep(5000);
    return await generateVideo(image);
  }
}
```

**The challenge:** Different errors require different recovery strategies.

### 4. Parallel Execution

Some steps can run in parallel:

```typescript
// These don't depend on each other
const [image1, image2, audio] = await Promise.all([
  generateImage(prompt1),
  generateImage(prompt2),
  generateAudio(script),
]);

// This depends on all of them
const final = await mergeAssets(image1, image2, audio);
```

**The challenge:** You need to track which steps can run concurrently without breaking dependencies.

## Orchestration Patterns

### Pattern 1: Sequential Pipeline

Each step runs one after another.

```typescript
async function sequentialPipeline(input: string) {
  // Step 1: Generate image
  const image = await generateImage(input);

  // Step 2: Generate video from image
  const video = await generateVideo(image);

  // Step 3: Add audio
  const audio = await generateAudio(input);

  // Step 4: Merge
  const final = await mergeVideoAudio(video, audio);

  return final;
}
```

**Use when:** Steps have strict dependencies.

**Pros:** Simple, predictable
**Cons:** Slow (no parallelism), fails completely on any error

### Pattern 2: Parallel Fan-Out/Fan-In

Multiple steps run in parallel, then results are combined.

```typescript
async function parallelPipeline(input: string) {
  // Fan-out: run in parallel
  const [image, audio, captions] = await Promise.all([
    generateImage(input),
    generateAudio(input),
    generateCaptions(input),
  ]);

  // Fan-in: combine results
  const video = await createVideoWithAssets({
    image,
    audio,
    captions,
  });

  return video;
}
```

**Use when:** Steps are independent.

**Pros:** Fast, efficient
**Cons:** All steps must succeed before fan-in

### Pattern 3: Conditional Branching

Different steps based on conditions.

```typescript
async function conditionalPipeline(input: string) {
  const image = await generateImage(input);

  // Branch based on image properties
  const metadata = await analyzeImage(image);

  if (metadata.hasText) {
    // Text-to-speech path
    const text = await extractText(image);
    const audio = await textToSpeech(text);
    return await createVideoWithNarration(image, audio);
  } else {
    // Music path
    const music = await generateBackgroundMusic(input);
    return await createVideoWithMusic(image, music);
  }
}
```

**Use when:** Workflow varies based on intermediate results.

**Pros:** Flexible, efficient
**Cons:** Complex state tracking

### Pattern 4: Retry with Exponential Backoff

Automatically retry failed steps.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on permanent failures
      if (error.code === "INVALID_INPUT") {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }

  throw lastError;
}

// Usage
const image = await withRetry(() => generateImage(prompt));
```

**Use when:** Failures are often transient.

**Pros:** Resilient to temporary issues
**Cons:** Can increase latency

## State Management

Orchestration requires tracking the state of your pipeline.

### Simple In-Memory State

```typescript
interface PipelineState {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  steps: StepState[];
  createdAt: Date;
  updatedAt: Date;
}

interface StepState {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const pipelines = new Map<string, PipelineState>();

function updateStep(
  pipelineId: string,
  stepId: string,
  update: Partial<StepState>,
) {
  const pipeline = pipelines.get(pipelineId);
  const step = pipeline.steps.find((s) => s.id === stepId);
  Object.assign(step, update);
  pipeline.updatedAt = new Date();
}
```

**Problem:** State is lost if your server restarts.

### Persistent State (Database)

```typescript
// Store in database
await db.pipelines.update(pipelineId, {
  steps: [
    { id: "step1", status: "completed", output: "..." },
    { id: "step2", status: "processing", output: null },
  ],
});

// Resume after restart
const pipeline = await db.pipelines.findById(pipelineId);
const currentStep = pipeline.steps.find((s) => s.status === "processing");
await resumeStep(currentStep);
```

**Better:** State persists across restarts.

### Job Queue State (BullMQ, etc.)

```typescript
import { Queue, Worker } from "bullmq";

const pipelineQueue = new Queue("pipelines");

// Add job
await pipelineQueue.add("generate-video", {
  pipelineId: "abc123",
  input: { prompt: "a cat" },
});

// Worker processes job
const worker = new Worker("pipelines", async (job) => {
  const { pipelineId, input } = job.data;

  // Update progress
  await job.updateProgress(25);
  const image = await generateImage(input.prompt);

  await job.updateProgress(50);
  const video = await generateVideo(image);

  await job.updateProgress(75);
  const audio = await generateAudio(input.prompt);

  await job.updateProgress(100);
  return await mergeVideoAudio(video, audio);
});
```

**Best:** State management + retry logic + progress tracking built-in.

## Error Handling and Recovery

### Strategy 1: Fail Fast

```typescript
async function failFastPipeline(input: string) {
  try {
    const image = await generateImage(input);
    const video = await generateVideo(image);
    return video;
  } catch (error) {
    // Fail entire pipeline on any error
    throw new PipelineError("Pipeline failed", { cause: error });
  }
}
```

**Use when:** Any failure makes the result unusable.

### Strategy 2: Partial Success

```typescript
async function partialSuccessPipeline(input: string) {
  const results = {
    image: null,
    video: null,
    audio: null,
    errors: [],
  };

  try {
    results.image = await generateImage(input);
  } catch (error) {
    results.errors.push({ step: "image", error });
  }

  try {
    if (results.image) {
      results.video = await generateVideo(results.image);
    }
  } catch (error) {
    results.errors.push({ step: "video", error });
  }

  try {
    results.audio = await generateAudio(input);
  } catch (error) {
    results.errors.push({ step: "audio", error });
  }

  return results;
}
```

**Use when:** Some outputs are better than none.

### Strategy 3: Compensation

Undo completed steps when a later step fails.

```typescript
async function compensatingPipeline(input: string) {
  let image, video;

  try {
    // Step 1
    image = await generateImage(input);
    await saveToStorage(image);

    // Step 2
    video = await generateVideo(image);
    await saveToStorage(video);

    // Step 3
    return await publishVideo(video);
  } catch (error) {
    // Compensation: clean up
    if (video) await deleteFromStorage(video);
    if (image) await deleteFromStorage(image);
    throw error;
  }
}
```

**Use when:** Side effects need to be rolled back.

## Implementation Approaches

### 1. DIY Orchestration

```typescript
class PipelineOrchestrator {
  async execute(pipeline: PipelineDefinition) {
    const state = await this.initState(pipeline);

    for (const step of pipeline.steps) {
      await this.updateState(state.id, step.id, { status: "processing" });

      try {
        const output = await this.executeStep(step, state);
        await this.updateState(state.id, step.id, {
          status: "completed",
          output,
        });
      } catch (error) {
        await this.updateState(state.id, step.id, {
          status: "failed",
          error: error.message,
        });
        throw error;
      }
    }

    return state;
  }

  private async executeStep(step: StepDefinition, state: PipelineState) {
    // Provider-specific logic
    switch (step.provider) {
      case "replicate":
        return await this.executeReplicate(step);
      case "fal":
        return await this.executeFal(step);
      default:
        throw new Error(`Unknown provider: ${step.provider}`);
    }
  }
}
```

**Pros:** Full control, no dependencies
**Cons:** Lots of code, need to handle everything yourself

### 2. Queue-Based Orchestration

```typescript
import { Queue, Worker } from "bullmq";

// Define pipeline as job chain
await imageQueue.add("generate", { prompt });

const imageWorker = new Worker("images", async (job) => {
  const image = await generateImage(job.data.prompt);

  // Chain next job
  await videoQueue.add("generate", { image });

  return image;
});

const videoWorker = new Worker("videos", async (job) => {
  return await generateVideo(job.data.image);
});
```

**Pros:** Reliable, scalable, built-in retries
**Cons:** Complex setup, more moving parts

### 3. Workflow Engine (Temporal, etc.)

```typescript
import { workflow } from "@temporalio/workflow";

export async function videoPipeline(input: string): Promise<string> {
  // Temporal handles retries, state, recovery
  const image = await workflow.executeActivity(generateImage, input);
  const video = await workflow.executeActivity(generateVideo, image);
  const audio = await workflow.executeActivity(generateAudio, input);
  return await workflow.executeActivity(mergeVideoAudio, video, audio);
}
```

**Pros:** Production-grade, handles everything
**Cons:** Heavy dependency, complex setup

### 4. Pipeline SDK (Synthome)

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  generateAudio,
  merge,
  imageModel,
  videoModel,
  audioModel,
} from "@synthome/sdk";

const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      image: generateImage({
        model: imageModel("google/nano-banana", "fal"),
        prompt: "a cat in space",
      }),
    }),
    generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "A cat floating in space",
    }),
  ]),
).execute();

console.log(execution.result?.url);
```

**Pros:** Purpose-built for AI, minimal code, automatic parallelization
**Cons:** Another service dependency

## Practical Example: Multi-Step Video Pipeline

Let's build a complete orchestration example:

**Goal:** Text → Image → Video → Audio → Final Video with Audio

```typescript
import { Queue, Worker } from "bullmq";

// Job definitions
interface PipelineJob {
  pipelineId: string;
  input: {
    prompt: string;
    script: string;
  };
}

interface StepJob {
  pipelineId: string;
  stepId: string;
  input: any;
}

// Queues
const pipelineQueue = new Queue<PipelineJob>("pipelines");
const stepQueue = new Queue<StepJob>("steps");

// Pipeline coordinator
const pipelineWorker = new Worker<PipelineJob>("pipelines", async (job) => {
  const { pipelineId, input } = job.data;

  // Initialize pipeline state
  await db.pipelines.create({
    id: pipelineId,
    status: "processing",
    steps: [
      { id: "image", status: "pending" },
      { id: "video", status: "pending" },
      { id: "audio", status: "pending" },
      { id: "merge", status: "pending" },
    ],
  });

  // Start first step
  await stepQueue.add("execute", {
    pipelineId,
    stepId: "image",
    input: { prompt: input.prompt },
  });
});

// Step executor
const stepWorker = new Worker<StepJob>("steps", async (job) => {
  const { pipelineId, stepId, input } = job.data;

  // Update step status
  await db.pipelines.updateStep(pipelineId, stepId, {
    status: "processing",
  });

  try {
    // Execute step
    let output;
    switch (stepId) {
      case "image":
        output = await generateImage(input.prompt);
        // Queue next step
        await stepQueue.add("execute", {
          pipelineId,
          stepId: "video",
          input: { image: output.url },
        });
        break;

      case "video":
        output = await generateVideo(input.image);
        // Queue parallel steps
        const pipeline = await db.pipelines.findById(pipelineId);
        await stepQueue.add("execute", {
          pipelineId,
          stepId: "audio",
          input: { script: pipeline.input.script },
        });
        break;

      case "audio":
        output = await generateAudio(input.script);
        // Check if video is ready
        const steps = await db.pipelines.getSteps(pipelineId);
        if (steps.video.status === "completed") {
          await stepQueue.add("execute", {
            pipelineId,
            stepId: "merge",
            input: {
              video: steps.video.output.url,
              audio: output.url,
            },
          });
        }
        break;

      case "merge":
        output = await mergeVideoAudio(input.video, input.audio);
        // Mark pipeline complete
        await db.pipelines.update(pipelineId, {
          status: "completed",
          output: output.url,
        });
        break;
    }

    // Update step status
    await db.pipelines.updateStep(pipelineId, stepId, {
      status: "completed",
      output,
    });

    return output;
  } catch (error) {
    // Update step status
    await db.pipelines.updateStep(pipelineId, stepId, {
      status: "failed",
      error: error.message,
    });

    // Mark pipeline failed
    await db.pipelines.update(pipelineId, {
      status: "failed",
      error: `Step ${stepId} failed: ${error.message}`,
    });

    throw error;
  }
});
```

**[Diagram Placeholder: Pipeline Orchestration Flow]**

- Show pipeline coordinator → step executor → model providers
- Illustrate state transitions and parallel execution
- Show error handling paths

## Monitoring and Observability

Track pipeline execution:

```typescript
// Metrics to track
interface PipelineMetrics {
  pipelineId: string;
  totalDuration: number;
  stepDurations: Record<string, number>;
  cost: number;
  status: "completed" | "failed";
  failedStep?: string;
}

// Collect metrics
async function trackPipeline(pipelineId: string) {
  const pipeline = await db.pipelines.findById(pipelineId);

  const metrics: PipelineMetrics = {
    pipelineId,
    totalDuration: pipeline.completedAt - pipeline.createdAt,
    stepDurations: {},
    cost: 0,
    status: pipeline.status,
  };

  for (const step of pipeline.steps) {
    metrics.stepDurations[step.id] = step.completedAt - step.startedAt;
    metrics.cost += step.cost || 0;

    if (step.status === "failed") {
      metrics.failedStep = step.id;
    }
  }

  await analytics.track("pipeline_completed", metrics);
}
```

## Conclusion

Orchestrating multi-model AI pipelines requires:

1. **Dependency management** - Track which steps depend on others
2. **State persistence** - Survive restarts and failures
3. **Error recovery** - Handle failures gracefully
4. **Parallel execution** - Run independent steps concurrently
5. **Progress tracking** - Update users in real-time

**Implementation options:**

| **Approach**    | **Complexity** | **Control** | **Best For**                  |
| --------------- | -------------- | ----------- | ----------------------------- |
| DIY             | High           | Full        | Small projects, learning      |
| Queues          | Medium         | High        | Production apps, scale        |
| Workflow Engine | Medium         | Medium      | Mission-critical systems      |
| Pipeline SDK    | Low            | Medium      | Fast development, AI-specific |

**For most teams:**

- Start with **DIY** to understand the problem
- Move to **Queues** when you need reliability
- Consider **Synthome** if you want AI-specific orchestration without the boilerplate

The best orchestration strategy is the one that matches your scale and complexity—start simple, add complexity as needed.

**Ready to skip the orchestration complexity?** Try [Synthome](https://synthome.ai)—it handles state management, retries, and multi-provider coordination out of the box.
