# How to Build Multi-Model AI Pipelines That Don't Break

You chain two AI models together. It works in testing. You deploy to production.

Then:

- Model A returns a 1024x1024 image
- Model B expects 512x512
- Pipeline breaks

Or:

- Model A takes 15 seconds
- Model B times out after 10 seconds
- Pipeline breaks

Or:

- Model A succeeds
- Model B fails
- You've already spent $0.50 on Model A
- Pipeline breaks

**Multi-model AI pipelines are fragile by default.** Each model has different timing, schemas, failure modes, and costs. Chaining them together multiplies the complexity.

This guide shows you how to build pipelines that actually work in production: handling output mismatches, coordinating async execution, recovering from failures, and keeping costs under control.

## The Core Problem: Output → Input Mismatch

The biggest issue with multi-model pipelines: **one model's output format doesn't match the next model's input requirements.**

### Example: Image Generation → Video Generation

**Model A (SDXL)** returns:

```json
{
  "output": ["https://replicate.delivery/image.png"]
}
```

**Model B (Stable Video Diffusion)** expects:

```json
{
  "image": "https://...", // ✓ We have this
  "sizing_strategy": "maintain_aspect_ratio", // Where do we get this?
  "frames_per_second": 6, // Default? User input?
  "motion_bucket_id": 127 // What even is this?
}
```

**Problems:**

1. Schema mismatch (`output` array vs `image` string)
2. Missing required parameters
3. Unclear defaults
4. Documentation doesn't explain `motion_bucket_id`

### The Naive Approach (Breaks in Production)

```typescript
// Generate image
const imageResult = await generateImage(prompt);
const imageUrl = imageResult.output[0];

// Generate video (BROKEN)
const videoResult = await generateVideo({
  image: imageUrl,
  // Missing: sizing_strategy, frames_per_second, motion_bucket_id
});
```

This throws: `Missing required parameter: motion_bucket_id`

### The Working Approach

```typescript
// Generate image
const imageResult = await generateImage(prompt);
const imageUrl = imageResult.output[0];

// Validate and normalize
if (!imageUrl) {
  throw new Error("Image generation returned no output");
}

// Generate video with all required params
const videoResult = await generateVideo({
  image: imageUrl,
  sizing_strategy: "maintain_aspect_ratio",
  frames_per_second: 6,
  motion_bucket_id: 127, // Research shows this is the default
});

// Validate output
if (!videoResult.output) {
  throw new Error("Video generation returned no output");
}
```

**Notice:**

- Validation after each step
- Explicit defaults for all parameters
- Error messages that help debugging

## Challenge 1: Timing and Async Coordination

AI models are async and take unpredictable amounts of time.

### The Problem

```typescript
// Model A: 5-30 seconds
const image = await generateImage(prompt);

// Model B: 20-120 seconds (depends on Model A output)
const video = await generateVideo(image);

// Model C: 3-15 seconds
const audio = await generateAudio(script);

// Model D: 10-40 seconds (depends on B and C)
const final = await mergeVideoAudio(video, audio);
```

**Issues:**

- Total time: 38-205 seconds (huge variance)
- Models B and C could run in parallel (but don't by default)
- If Model D fails, you've wasted 30-135 seconds

### Sequential Execution (Slow but Simple)

```typescript
async function sequentialPipeline(prompt: string, script: string) {
  const startTime = Date.now();

  // Step 1: Image (5-30s)
  const image = await generateImage(prompt);
  console.log(`Image done: ${Date.now() - startTime}ms`);

  // Step 2: Video (20-120s)
  const video = await generateVideo(image);
  console.log(`Video done: ${Date.now() - startTime}ms`);

  // Step 3: Audio (3-15s)
  const audio = await generateAudio(script);
  console.log(`Audio done: ${Date.now() - startTime}ms`);

  // Step 4: Merge (10-40s)
  const final = await mergeVideoAudio(video, audio);
  console.log(`Final done: ${Date.now() - startTime}ms`);

  return final;
}
```

**Total time:** 38-205 seconds

### Parallel Execution (Faster but Complex)

```typescript
async function parallelPipeline(prompt: string, script: string) {
  const startTime = Date.now();

  // Step 1: Image (5-30s)
  const image = await generateImage(prompt);
  console.log(`Image done: ${Date.now() - startTime}ms`);

  // Steps 2 & 3: Parallel (max of 20-120s or 3-15s = 20-120s)
  const [video, audio] = await Promise.all([
    generateVideo(image),
    generateAudio(script),
  ]);
  console.log(`Video & Audio done: ${Date.now() - startTime}ms`);

  // Step 4: Merge (10-40s)
  const final = await mergeVideoAudio(video, audio);
  console.log(`Final done: ${Date.now() - startTime}ms`);

  return final;
}
```

**Total time:** 35-190 seconds (15-second improvement)

**But now:**

- If video fails, audio has already run (wasted cost)
- If audio fails, video has already run (wasted cost)
- Error handling is more complex

### Parallel with Cancellation

```typescript
async function parallelWithCancellation(prompt: string, script: string) {
  const image = await generateImage(prompt);

  // Use AbortController to cancel on failure
  const videoController = new AbortController();
  const audioController = new AbortController();

  const videoPromise = generateVideo(image, { signal: videoController.signal });
  const audioPromise = generateAudio(script, {
    signal: audioController.signal,
  });

  try {
    const [video, audio] = await Promise.all([videoPromise, audioPromise]);
    return await mergeVideoAudio(video, audio);
  } catch (error) {
    // Cancel any still-running jobs
    videoController.abort();
    audioController.abort();
    throw error;
  }
}
```

**Better:** Failed jobs don't waste resources.

**Problem:** Not all APIs support cancellation.

## Challenge 2: Failure Cascades

When one model fails, the entire pipeline often fails—even if you've already spent money on previous steps.

### Example: Late-Stage Failure

```typescript
// Step 1: $0.10
const image = await generateImage(prompt);

// Step 2: $0.50
const video = await generateVideo(image);

// Step 3: $0.05
const audio = await generateAudio(script);

// Step 4: FAILS
const final = await mergeVideoAudio(video, audio);
// Error: "Video and audio have different durations"

// Total spent: $0.65
// Total value: $0.00
```

You've spent $0.65 and have nothing to show for it.

### Pattern 1: Validate Early

```typescript
async function pipelineWithValidation(prompt: string, script: string) {
  // Step 1: Generate image
  const image = await generateImage(prompt);

  // Validate before proceeding
  const imageInfo = await getImageInfo(image.url);
  if (imageInfo.width < 512 || imageInfo.height < 512) {
    throw new Error("Image too small for video generation");
  }

  // Step 2: Generate video
  const video = await generateVideo(image);

  // Validate before audio generation
  const videoInfo = await getVideoInfo(video.url);
  if (videoInfo.duration < 1) {
    throw new Error("Video too short");
  }

  // Step 3: Generate audio to match video duration
  const audio = await generateAudio(script, {
    duration: videoInfo.duration, // Match video length
  });

  // Step 4: Merge (now much less likely to fail)
  return await mergeVideoAudio(video, audio);
}
```

**Key idea:** Catch issues early before spending on subsequent steps.

### Pattern 2: Checkpointing

```typescript
interface PipelineCheckpoint {
  pipelineId: string;
  completedSteps: {
    image?: { url: string; cost: number };
    video?: { url: string; cost: number };
    audio?: { url: string; cost: number };
  };
  totalCost: number;
}

async function pipelineWithCheckpoints(
  prompt: string,
  script: string,
  checkpoint?: PipelineCheckpoint,
): Promise<string> {
  const state = checkpoint || {
    pipelineId: generateId(),
    completedSteps: {},
    totalCost: 0,
  };

  // Step 1: Image (skip if already done)
  if (!state.completedSteps.image) {
    const image = await generateImage(prompt);
    state.completedSteps.image = { url: image.url, cost: 0.1 };
    state.totalCost += 0.1;
    await saveCheckpoint(state); // Persist to DB
  }

  // Step 2: Video (skip if already done)
  if (!state.completedSteps.video) {
    const video = await generateVideo(state.completedSteps.image.url);
    state.completedSteps.video = { url: video.url, cost: 0.5 };
    state.totalCost += 0.5;
    await saveCheckpoint(state);
  }

  // Step 3: Audio (skip if already done)
  if (!state.completedSteps.audio) {
    const audio = await generateAudio(script);
    state.completedSteps.audio = { url: audio.url, cost: 0.05 };
    state.totalCost += 0.05;
    await saveCheckpoint(state);
  }

  // Step 4: Merge
  const final = await mergeVideoAudio(
    state.completedSteps.video.url,
    state.completedSteps.audio.url,
  );

  return final.url;
}

// Retry from checkpoint on failure
try {
  const result = await pipelineWithCheckpoints(prompt, script);
} catch (error) {
  // Load checkpoint and retry
  const checkpoint = await loadCheckpoint(pipelineId);
  const result = await pipelineWithCheckpoints(prompt, script, checkpoint);
}
```

**Key idea:** Save progress so failures can resume, not restart.

### Pattern 3: Graceful Degradation

```typescript
async function pipelineWithFallbacks(prompt: string, script: string) {
  const image = await generateImage(prompt);

  let video;
  try {
    video = await generateVideo(image);
  } catch (error) {
    console.warn("Video generation failed, using static image");
    video = await createStaticVideo(image); // Fallback: image → static video
  }

  let audio;
  try {
    audio = await generateAudio(script);
  } catch (error) {
    console.warn("Audio generation failed, using silent audio");
    audio = await createSilentAudio(video.duration); // Fallback: silent track
  }

  return await mergeVideoAudio(video, audio);
}
```

**Key idea:** Degrade gracefully rather than failing completely.

## Challenge 3: Cost Management

Different models have different pricing models, making cost tracking complex.

### The Cost Tracking Problem

```typescript
// Replicate: per-second billing
const image = await generateImage(prompt);
// Cost: ~$0.023 * execution_time_seconds

// Fal: per-request billing
const video = await generateVideo(image);
// Cost: ~$0.05 per generation

// ElevenLabs: per-character billing
const audio = await generateAudio(script);
// Cost: ~$0.0003 * character_count

// How do you know the total cost?
```

### Solution: Cost Tracking Wrapper

```typescript
interface StepResult<T> {
  output: T;
  cost: number;
  duration: number;
}

async function trackCost<T>(
  stepName: string,
  provider: string,
  fn: () => Promise<T>,
): Promise<StepResult<T>> {
  const startTime = Date.now();

  try {
    const output = await fn();
    const duration = Date.now() - startTime;
    const cost = estimateCost(provider, duration, output);

    await logMetrics({
      step: stepName,
      provider,
      status: "success",
      cost,
      duration,
    });

    return { output, cost, duration };
  } catch (error) {
    await logMetrics({
      step: stepName,
      provider,
      status: "failed",
      duration: Date.now() - startTime,
    });
    throw error;
  }
}

// Usage
async function pipelineWithCostTracking(prompt: string, script: string) {
  let totalCost = 0;

  const { output: image, cost: imageCost } = await trackCost(
    "generate_image",
    "replicate",
    () => generateImage(prompt),
  );
  totalCost += imageCost;

  const { output: video, cost: videoCost } = await trackCost(
    "generate_video",
    "fal",
    () => generateVideo(image),
  );
  totalCost += videoCost;

  const { output: audio, cost: audioCost } = await trackCost(
    "generate_audio",
    "elevenlabs",
    () => generateAudio(script),
  );
  totalCost += audioCost;

  console.log(`Total pipeline cost: $${totalCost.toFixed(2)}`);

  return await mergeVideoAudio(video, audio);
}
```

## Challenge 4: Provider Differences

Each provider has different APIs, schemas, and quirks.

### The Standardization Problem

```typescript
// Three different output formats
const replicateImage = { output: ["https://..."] };
const falImage = { images: [{ url: "https://..." }] };
const openaiImage = { data: [{ url: "https://..." }] };

// You need a normalizer
function normalizeImageOutput(result: any, provider: string): string {
  switch (provider) {
    case "replicate":
      return Array.isArray(result.output) ? result.output[0] : result.output;
    case "fal":
      return result.images[0].url;
    case "openai":
      return result.data[0].url;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### Solution: Unified Interface

```typescript
interface ModelProvider {
  generateImage(input: ImageInput): Promise<string>;
  generateVideo(input: VideoInput): Promise<string>;
  generateAudio(input: AudioInput): Promise<string>;
}

class ReplicateProvider implements ModelProvider {
  async generateImage(input: ImageInput): Promise<string> {
    const result = await replicate.run("stability-ai/sdxl", {
      input: { prompt: input.prompt },
    });
    return Array.isArray(result) ? result[0] : result;
  }

  async generateVideo(input: VideoInput): Promise<string> {
    const result = await replicate.run("stability-ai/stable-video-diffusion", {
      input: {
        image: input.image,
        sizing_strategy: "maintain_aspect_ratio",
        motion_bucket_id: 127,
      },
    });
    return result;
  }

  // ... other methods
}

class FalProvider implements ModelProvider {
  async generateImage(input: ImageInput): Promise<string> {
    const result = await fal.subscribe("fal-ai/fast-sdxl", {
      input: { prompt: input.prompt },
    });
    return result.images[0].url;
  }

  // ... other methods
}

// Usage: provider-agnostic
async function generateWithProvider(
  provider: ModelProvider,
  prompt: string,
): Promise<string> {
  const image = await provider.generateImage({ prompt });
  const video = await provider.generateVideo({ image });
  return video;
}
```

## Building Reliable Pipelines: Complete Example

Here's a production-ready multi-model pipeline:

```typescript
import { Queue, Worker } from "bullmq";

interface PipelineInput {
  pipelineId: string;
  prompt: string;
  script: string;
}

interface PipelineState {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  steps: {
    image?: { url: string; cost: number };
    video?: { url: string; cost: number };
    audio?: { url: string; cost: number };
    merge?: { url: string; cost: number };
  };
  totalCost: number;
  error?: string;
}

// Job queue
const pipelineQueue = new Queue<PipelineInput>("video-pipeline");

// Worker
const worker = new Worker<PipelineInput>("video-pipeline", async (job) => {
  const { pipelineId, prompt, script } = job.data;

  // Load or create state
  let state: PipelineState = (await db.findPipeline(pipelineId)) || {
    id: pipelineId,
    status: "processing",
    steps: {},
    totalCost: 0,
  };

  try {
    // Step 1: Generate image (if not done)
    if (!state.steps.image) {
      await job.updateProgress(10);

      const imageResult = await withRetry(() => generateImage(prompt));

      // Validate
      const imageInfo = await getImageInfo(imageResult.url);
      if (imageInfo.width < 512) {
        throw new Error("Image resolution too low");
      }

      state.steps.image = {
        url: imageResult.url,
        cost: 0.1,
      };
      state.totalCost += 0.1;
      await db.updatePipeline(state);
    }

    // Step 2: Generate video (if not done)
    if (!state.steps.video) {
      await job.updateProgress(40);

      const videoResult = await withRetry(() =>
        generateVideo(state.steps.image.url),
      );

      state.steps.video = {
        url: videoResult.url,
        cost: 0.5,
      };
      state.totalCost += 0.5;
      await db.updatePipeline(state);
    }

    // Step 3: Generate audio (if not done)
    if (!state.steps.audio) {
      await job.updateProgress(70);

      // Get video duration to match audio
      const videoInfo = await getVideoInfo(state.steps.video.url);

      const audioResult = await withRetry(() =>
        generateAudio(script, { duration: videoInfo.duration }),
      );

      state.steps.audio = {
        url: audioResult.url,
        cost: 0.05,
      };
      state.totalCost += 0.05;
      await db.updatePipeline(state);
    }

    // Step 4: Merge
    if (!state.steps.merge) {
      await job.updateProgress(90);

      const finalResult = await withRetry(() =>
        mergeVideoAudio(state.steps.video.url, state.steps.audio.url),
      );

      state.steps.merge = {
        url: finalResult.url,
        cost: 0.02,
      };
      state.totalCost += 0.02;
    }

    // Mark complete
    state.status = "completed";
    await db.updatePipeline(state);
    await job.updateProgress(100);

    return state.steps.merge.url;
  } catch (error) {
    state.status = "failed";
    state.error = error.message;
    await db.updatePipeline(state);
    throw error;
  }
});

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

**[Diagram Placeholder: Multi-Model Pipeline Flow]**

- Show Image → Video → Audio → Merge pipeline
- Illustrate checkpointing at each step
- Show retry logic and error handling paths
- Display parallel execution where possible

## Testing Multi-Model Pipelines

### Unit Test Individual Steps

```typescript
describe("generateImage", () => {
  it("should return valid image URL", async () => {
    const result = await generateImage("a cat");
    expect(result.url).toMatch(/^https:\/\//);
  });

  it("should retry on timeout", async () => {
    // Mock API to fail first two times
    mockAPI.failTimes(2);
    const result = await generateImage("a cat");
    expect(result).toBeDefined();
  });
});
```

### Integration Test Full Pipeline

```typescript
describe("video pipeline", () => {
  it("should complete full pipeline", async () => {
    const result = await runPipeline({
      prompt: "a cat",
      script: "This is a cat"
    });

    expect(result.steps.image).toBeDefined();
    expect(result.steps.video).toBeDefined();
    expect(result.steps.audio).toBeDefined();
    expect(result.steps.merge).toBeDefined();
  });

  it("should resume from checkpoint on failure", async () => {
    // Fail video step
    mockVideo.fail();

    await expect(runPipeline({...})).rejects.toThrow();

    // Resume should skip image step
    mockVideo.succeed();
    const result = await resumePipeline(pipelineId);
    expect(result.status).toBe("completed");
  });
});
```

### Mock Expensive Calls

```typescript
// Mock for testing
const mockProviders = {
  replicate: {
    generateImage: jest.fn().mockResolvedValue({
      url: "https://mock-image.png",
    }),
  },
  fal: {
    generateVideo: jest.fn().mockResolvedValue({
      url: "https://mock-video.mp4",
    }),
  },
};

// Test with mocks
const result = await runPipeline(input, { providers: mockProviders });
expect(mockProviders.replicate.generateImage).toHaveBeenCalledTimes(1);
```

## Conclusion

Building multi-model AI pipelines that don't break requires:

1. **Output normalization** - Standardize schemas across providers
2. **Validation** - Catch issues early before spending on later steps
3. **Checkpointing** - Save progress so failures can resume
4. **Parallel execution** - Run independent steps concurrently
5. **Cost tracking** - Monitor spending across different pricing models
6. **Retry logic** - Handle transient failures gracefully
7. **Graceful degradation** - Provide fallbacks when possible

**Key principles:**

- **Validate early** - Don't waste money on doomed pipelines
- **Checkpoint often** - Make failures recoverable
- **Track everything** - Costs, durations, success rates
- **Abstract providers** - Don't let provider differences leak everywhere

**Implementation options:**

- **DIY** - Full control, lots of code
- **Job queues** - Production-ready, complex setup
- **Pipeline SDK** - Minimal code, handles orchestration

**For most teams:** Start simple, add complexity as you learn where things break.

**Want reliable multi-model pipelines without the boilerplate?** Check out [Synthome](https://synthome.ai)—it handles normalization, retries, checkpointing, and cost tracking out of the box.
