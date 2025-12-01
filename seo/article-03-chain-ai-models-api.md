# How to Chain AI Models (Image → Video → Audio) Using TypeScript

Chaining AI models means connecting one model's output to another's input—turning a text description into an image, that image into a video, and adding audio narration. This guide shows you how to orchestrate sequential and parallel model execution in TypeScript, handle dependencies, and avoid the pitfalls that break multi-step AI workflows.

---

## Why Chain AI Models?

Single AI models are powerful, but combining them unlocks new capabilities:

- **Text → Image → Video**: Generate a picture, then animate it
- **Image → Background Removal → Composite**: Clean up an image, layer it over a new background
- **Video → Transcription → Translation → TTS**: Transcribe a video, translate it, generate dubbed audio
- **Text → Image (multiple) → Video Merge**: Create a multi-scene video from text prompts

Each model specializes in one task. Chaining them creates end-to-end workflows that would be impossible with a single model.

The challenge: each model has different async patterns, different input/output formats, and different failure modes. Your chaining logic needs to handle all of it.

## The Anatomy of Model Chaining

Model chaining has three layers:

### 1. Sequential Dependencies

Some operations must run in order. You can't animate an image before generating it.

```typescript
const image = await generateImage(prompt);
const video = await generateVideo(image);  // Depends on image
```

This is straightforward but slow—nothing runs in parallel.

### 2. Parallel Execution

Independent operations can run simultaneously. If you're generating three images, run all three at once:

```typescript
const [image1, image2, image3] = await Promise.all([
  generateImage("Prompt 1"),
  generateImage("Prompt 2"),
  generateImage("Prompt 3"),
]);
```

This is faster but requires careful orchestration—what if one fails?

### 3. Mixed Patterns

Real workflows combine sequential and parallel operations:

```typescript
// Step 1: Generate image (sequential dependency)
const image = await generateImage(prompt);

// Step 2: Generate video and audio in parallel (both depend on image)
const [video, audio] = await Promise.all([
  generateVideo(image),
  generateAudio("Narration text"),
]);

// Step 3: Merge video and audio (depends on both)
const final = await mergeVideoAudio(video, audio);
```

The orchestration layer needs to understand these dependencies automatically.

## The Problems You'll Hit

Let's walk through what breaks when you chain AI models manually.

### Problem 1: Polling Hell

Most AI APIs are async. You submit a job, poll for completion, then use the result:

```typescript
// Submit job
const job = await fetch("https://api.provider.com/generate", {
  method: "POST",
  body: JSON.stringify({ prompt: "A sunset" }),
});
const jobId = (await job.json()).id;

// Poll until done
let result = null;
while (!result) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const status = await fetch(`https://api.provider.com/jobs/${jobId}`);
  const data = await status.json();
  if (data.status === "completed") result = data.output;
}
```

Now imagine doing this for 5 models in a row. Your code becomes nested polling loops.

### Problem 2: Format Mismatches

Model A outputs a URL. Model B expects a base64-encoded image. Model C expects a binary blob.

```typescript
const imageUrl = await generateImage(prompt);

// Video model expects base64, but we have a URL
const imageResponse = await fetch(imageUrl);
const imageBuffer = await imageResponse.arrayBuffer();
const imageBase64 = Buffer.from(imageBuffer).toString("base64");

const video = await generateVideo(imageBase64);
```

Every model pair requires custom format conversion logic.

### Problem 3: Partial Failures

You're 3 steps into a 5-step pipeline. Step 4 fails. Do you:

- Start over from Step 1? (Expensive—you pay twice for Steps 1-3)
- Retry Step 4? (What if it fails again?)
- Skip Step 4? (Does that make the pipeline invalid?)

Without state tracking, you can't answer these questions.

### Problem 4: No Dependency Resolution

If you hardcode `await` calls, you can't optimize for parallelization. You need a dependency graph:

```
Step 1: Generate image A
Step 2: Generate image B (parallel with Step 1)
Step 3: Animate image A (depends on Step 1)
Step 4: Animate image B (depends on Step 2)
Step 5: Merge videos (depends on Steps 3 and 4)
```

This requires a scheduler that understands dependencies and runs operations as soon as their inputs are ready.

## Manual Model Chaining (The Hard Way)

Let's chain three models manually: Image → Video → Audio.

```typescript
interface GenerationResult {
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
}

async function chainModelsManually(
  imagePrompt: string,
  narration: string
): Promise<GenerationResult> {
  // Step 1: Generate image
  console.log("Generating image...");
  const imageJob = await fetch("https://api.fal.ai/fal-ai/flux/schnell", {
    method: "POST",
    headers: { "Authorization": `Key ${process.env.FAL_KEY}` },
    body: JSON.stringify({ prompt: imagePrompt }),
  });
  
  const imageData = await imageJob.json();
  const imageUrl = imageData.images[0].url;
  console.log("Image complete:", imageUrl);
  
  // Step 2: Generate video from image
  console.log("Generating video...");
  const videoJob = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "animate-diff-version-id",
      input: { path: imageUrl },
    }),
  });
  
  const videoData = await videoJob.json();
  
  // Poll for video completion
  let videoUrl: string | null = null;
  while (!videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const status = await fetch(
      `https://api.replicate.com/v1/predictions/${videoData.id}`,
      { headers: { "Authorization": `Token ${process.env.REPLICATE_API_KEY}` } }
    );
    const data = await status.json();
    if (data.status === "succeeded") videoUrl = data.output[0];
    if (data.status === "failed") throw new Error("Video generation failed");
  }
  console.log("Video complete:", videoUrl);
  
  // Step 3: Generate audio
  console.log("Generating audio...");
  const audioJob = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/voice-id",
    {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
      body: JSON.stringify({ text: narration }),
    }
  );
  
  const audioBuffer = await audioJob.arrayBuffer();
  const audioUrl = await uploadToCDN(audioBuffer, "audio.mp3");
  console.log("Audio complete:", audioUrl);
  
  return { imageUrl, videoUrl, audioUrl };
}
```

[DIAGRAM: Sequential flow showing Image generation → Wait → Video generation → Poll loop → Audio generation → Poll loop, with each step blocking the next]

**Problems with this approach:**

- **100+ lines** for a 3-step chain
- **No parallelization**: Audio could generate while video is processing
- **No retries**: Transient failures crash the whole pipeline
- **No state tracking**: Can't resume if it fails
- **Hard to modify**: Adding a step means rewriting orchestration logic

## Adding Parallelization

Let's optimize: generate audio while the video is processing.

```typescript
async function chainWithParallelization(
  imagePrompt: string,
  narration: string
) {
  // Step 1: Generate image (must be first)
  const imageUrl = await generateImage(imagePrompt);
  
  // Step 2: Generate video and audio in parallel
  const [videoUrl, audioUrl] = await Promise.all([
    generateVideo(imageUrl),      // Depends on image
    generateAudio(narration),     // Independent
  ]);
  
  // Step 3: Merge video and audio
  const finalVideo = await mergeVideoAudio(videoUrl, audioUrl);
  
  return finalVideo;
}
```

This is better, but now you're managing dependencies manually. If you add more operations, you need to figure out which ones can run in parallel and which can't.

## Handling Retries

Let's add retry logic for transient failures:

```typescript
async function retryableOperation<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }
  
  throw lastError!;
}

// Usage
const videoUrl = await retryableOperation(
  () => generateVideo(imageUrl),
  3
);
```

Now every operation needs to be wrapped in `retryableOperation()`. Your code gets verbose fast.

## Chaining with Abstractions

Let's rebuild the same workflow using a composable API:

```typescript
import { compose, generateImage, generateVideo, imageModel, videoModel } from "@synthome/sdk";

const result = await compose(
  generateVideo({
    image: generateImage({
      model: imageModel("fal-ai/flux/schnell", "fal"),
      prompt: "A serene mountain landscape at sunrise",
    }),
    model: videoModel("lucataco/animate-diff", "replicate"),
  })
).execute();

console.log("Video URL:", result.result?.url);
```

**What just happened:**

- Image generation runs first (dependency)
- Video generation waits for the image automatically
- Polling, retries, and state tracking happen behind the scenes
- No manual `await` chains or `Promise.all()` orchestration

### Adding Audio

Let's extend the chain to include audio:

```typescript
import { generateAudio, audioModel } from "@synthome/sdk";

const result = await compose(
  merge([
    generateVideo({
      image: generateImage({
        model: imageModel("fal-ai/flux/schnell", "fal"),
        prompt: "A serene mountain landscape at sunrise",
      }),
      model: videoModel("lucataco/animate-diff", "replicate"),
    }),
    generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "Welcome to the mountains",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    }),
  ])
).execute();
```

**What changed:**

- Audio generation now runs in parallel with video generation
- The `merge()` operation waits for both to complete
- No manual `Promise.all()` or dependency tracking

### Adding More Steps

Need to generate multiple scenes and merge them?

```typescript
const result = await compose(
  merge([
    generateVideo({
      image: generateImage({ prompt: "Scene 1: Mountains at sunrise" }),
      model: videoModel("animate-diff", "replicate"),
    }),
    generateVideo({
      image: generateImage({ prompt: "Scene 2: Ocean waves crashing" }),
      model: videoModel("animate-diff", "replicate"),
    }),
    generateVideo({
      image: generateImage({ prompt: "Scene 3: Forest in autumn" }),
      model: videoModel("animate-diff", "replicate"),
    }),
  ])
).execute();
```

All three scenes generate in parallel. Each scene generates its own image, then animates it. The merge waits for all three videos before combining them.

[DIAGRAM: Parallel execution showing three branches (Image → Video) running simultaneously, then converging into a merge operation]

## Advanced Chaining Patterns

### Branching Workflows

Generate one input, produce multiple outputs:

```typescript
const image = generateImage({ prompt: "A futuristic city" });

const result = await compose({
  hdVideo: generateVideo({
    image,
    model: videoModel("animate-diff", "replicate"),
    resolution: "1080p",
  }),
  thumbnail: resize({
    input: image,
    width: 400,
    height: 300,
  }),
}).execute();

// Access both outputs
console.log("HD Video:", result.result?.hdVideo.url);
console.log("Thumbnail:", result.result?.thumbnail.url);
```

### Conditional Chains

Run different operations based on runtime data:

```typescript
const image = generateImage({ prompt: "An abstract painting" });

// Check if background removal is needed
const needsBackgroundRemoval = true;

const processedImage = needsBackgroundRemoval
  ? removeBackground({ image })
  : image;

const video = generateVideo({ image: processedImage });
```

### Recursive Chains

Pipelines that generate inputs for subsequent pipelines:

```typescript
// Generate scene descriptions with LLM
const scenes = await llm.generate("Create 3 video scene descriptions");

// For each scene, generate image → video
const videos = scenes.map(scenePrompt =>
  generateVideo({
    image: generateImage({ prompt: scenePrompt }),
    model: videoModel("animate-diff", "replicate"),
  })
);

// Merge all videos
const final = await compose(merge(videos)).execute();
```

## Error Handling in Chains

When chaining models, failures happen. Here's how to handle them:

### Option 1: Fail Fast

If any operation fails, the entire chain fails:

```typescript
try {
  const result = await compose(
    generateVideo({ image: generateImage({ prompt }) })
  ).execute();
} catch (error) {
  console.error("Pipeline failed:", error.message);
}
```

### Option 2: Graceful Degradation

Provide fallbacks for non-critical operations:

```typescript
const result = await compose(
  generateVideo({
    image: generateImage({ prompt }).catch(() => 
      // Fallback to default image
      "https://example.com/default-image.jpg"
    ),
  })
).execute();
```

### Option 3: Partial Results

Return what succeeded, even if some operations failed:

```typescript
const result = await compose(
  merge([
    generateVideo({ prompt: "Scene 1" }),
    generateVideo({ prompt: "Scene 2" }),
    generateVideo({ prompt: "Scene 3" }),
  ])
).execute({ allowPartialResults: true });

// Merge will use only the videos that succeeded
```

## Best Practices for Model Chaining

### 1. Minimize Sequential Dependencies

Run operations in parallel whenever possible:

❌ **Bad** (sequential):
```typescript
const img1 = await generateImage("Prompt 1");
const img2 = await generateImage("Prompt 2");
const img3 = await generateImage("Prompt 3");
```

✅ **Good** (parallel):
```typescript
const [img1, img2, img3] = await Promise.all([
  generateImage("Prompt 1"),
  generateImage("Prompt 2"),
  generateImage("Prompt 3"),
]);
```

### 2. Validate Inputs Early

Don't start expensive operations if inputs are invalid:

```typescript
if (!prompt || prompt.length === 0) {
  throw new Error("Prompt cannot be empty");
}

const result = await compose(generateVideo({ prompt })).execute();
```

### 3. Cache Intermediate Results

If you're reusing outputs, cache them:

```typescript
const image = await generateImage({ prompt });

// Reuse the same image for multiple videos
const [video1, video2] = await Promise.all([
  generateVideo({ image, duration: 5 }),
  generateVideo({ image, duration: 10 }),
]);
```

### 4. Use Execution Plans for Complex Workflows

For dynamic workflows, generate execution plans programmatically:

```typescript
const plan = {
  jobs: scenes.map((scene, i) => ({
    id: `scene-${i}`,
    type: "generate",
    params: { prompt: scene },
    output: `$scene-${i}`,
  })),
};

const result = await executeFromPlan(plan);
```

This is powerful for AI agents that generate workflows dynamically.

## Monitoring Chain Execution

Track progress across chained operations:

```typescript
const execution = await compose(
  merge([
    generateVideo({ prompt: "Scene 1" }),
    generateVideo({ prompt: "Scene 2" }),
    generateVideo({ prompt: "Scene 3" }),
  ])
).execute();

console.log(`Progress: ${execution.progress}%`);
console.log(`Completed: ${execution.completedJobs}/${execution.totalJobs}`);
console.log(`Current job: ${execution.currentJob}`);
```

For async execution, check status with:

```typescript
const execution = await pipeline.execute({ webhook: "..." });

// Later, check progress
const status = await getExecutionStatus(execution.id);
console.log(status);
```

## When to Chain Models

**Use chaining when:**

- You need outputs from one model as inputs to another
- You're building multi-step generative workflows
- You want to compose operations (image → video → caption)

**Don't chain when:**

- You're calling a single model once
- Operations are completely independent (just run them separately)
- You're prototyping and want to inspect each step manually

## Wrapping Up

Chaining AI models is about orchestration, not just API calls. The key challenges are:

- Managing sequential and parallel execution
- Handling async polling across multiple providers
- Recovering from partial failures
- Tracking state across operations

You can build this manually, but the complexity grows fast. Abstractions handle orchestration, retries, and state tracking so you can focus on the workflow logic.

**Key takeaways:**

- Run independent operations in parallel
- Let the orchestration layer resolve dependencies
- Use retries for transient failures
- Cache intermediate results when possible
- Monitor execution progress for long-running chains

Start simple (chain 2 models), then add complexity (parallel execution, branching workflows, error handling). The patterns scale.

---

**Further reading:**

- Learn how to build a complete video generation API
- Explore execution plans for AI agent workflows
- Understand webhook patterns for async model chaining
