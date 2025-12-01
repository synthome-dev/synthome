# How to Combine Replicate, Fal, and ElevenLabs Into a Single Workflow

Building AI media workflows often means using multiple providers—Replicate for video models, Fal for fast image generation, ElevenLabs for realistic voiceovers. But each provider has different APIs, async patterns, and response schemas. This guide shows you how to combine all three into a unified workflow without drowning in integration code.

---

## Why Use Multiple Providers?

Different AI providers specialize in different capabilities:

**Replicate:**
- Broad model selection (Stable Diffusion, AnimateDiff, FLUX, etc.)
- Community-contributed models
- Pay-per-second pricing

**Fal:**
- Fastest inference speeds (optimized infrastructure)
- Low-latency image generation
- Real-time video models

**ElevenLabs:**
- Best-in-class text-to-speech
- Realistic voice cloning
- Emotion and intonation control

For a complete AI media pipeline, you need all three:

```
Text → Image (Fal) → Video (Replicate) → Voiceover (ElevenLabs) → Final Video
```

The problem: each provider has a completely different API.

## The API Differences You'll Face

Let's look at how each provider handles the same task: submitting a job and checking its status.

### Replicate API Pattern

```typescript
// Submit job
const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    "Authorization": `Token ${REPLICATE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    version: "model-version-id",
    input: { prompt: "A sunset over mountains" },
  }),
});

const job = await response.json();

// Poll for status
const statusResponse = await fetch(
  `https://api.replicate.com/v1/predictions/${job.id}`,
  { headers: { "Authorization": `Token ${REPLICATE_API_KEY}` } }
);

const status = await statusResponse.json();

if (status.status === "succeeded") {
  console.log("Output:", status.output);
}
```

**Key characteristics:**
- Uses `version` field for model identification
- Returns `id` field for job tracking
- Status values: `starting`, `processing`, `succeeded`, `failed`
- Output in `output` field (can be array or object)

### Fal API Pattern

```typescript
// Submit job (some models return immediately)
const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
  method: "POST",
  headers: {
    "Authorization": `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "A sunset over mountains",
  }),
});

const result = await response.json();

// Some models require polling
if (result.request_id) {
  const statusResponse = await fetch(
    `https://fal.run/fal-ai/queue/requests/${result.request_id}/status`,
    { headers: { "Authorization": `Key ${FAL_KEY}` } }
  );
  
  const status = await statusResponse.json();
  
  if (status.status === "COMPLETED") {
    console.log("Output:", status.result);
  }
}
```

**Key characteristics:**
- Uses model path in URL (not a version ID)
- Returns `request_id` for async jobs
- Status values: `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`, `FAILED`
- Output in `result` field (not `output`)
- Some models return results immediately (no polling)

### ElevenLabs API Pattern

```typescript
// Generate audio (synchronous)
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Welcome to our video",
      model_id: "eleven_turbo_v2_5",
    }),
  }
);

// Returns audio data directly (not a URL)
const audioBuffer = await response.arrayBuffer();

// You need to upload it somewhere
const audioUrl = await uploadToS3(audioBuffer);
```

**Key characteristics:**
- Synchronous response (no polling)
- Returns binary audio data, not a URL
- Voice ID in the URL path
- Model specified in request body

[DIAGRAM: Three different API patterns side by side showing Replicate (async with polling), Fal (mixed sync/async), and ElevenLabs (sync with binary response)]

## The Integration Problem

If you're building a workflow that uses all three providers, you need:

1. **Three different authentication patterns**
2. **Three different request formats**
3. **Three different response schemas**
4. **Three different polling mechanisms**
5. **Three different error formats**

Here's what the integration code looks like:

```typescript
async function multiProviderWorkflow(prompt: string, narration: string) {
  // Step 1: Generate image with Fal
  const falResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  
  const falData = await falResponse.json();
  const imageUrl = falData.images[0].url;
  
  // Step 2: Generate video with Replicate
  const replicateResponse = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "animate-diff-version-id",
        input: { path: imageUrl },
      }),
    }
  );
  
  const replicateJob = await replicateResponse.json();
  
  // Poll Replicate for completion
  let videoUrl: string | null = null;
  while (!videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${replicateJob.id}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );
    const status = await statusResponse.json();
    if (status.status === "succeeded") videoUrl = status.output[0];
    if (status.status === "failed") throw new Error("Video generation failed");
  }
  
  // Step 3: Generate audio with ElevenLabs
  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: narration,
        model_id: "eleven_turbo_v2_5",
      }),
    }
  );
  
  // ElevenLabs returns audio data, not a URL
  const audioBuffer = await elevenLabsResponse.arrayBuffer();
  const audioUrl = await uploadToS3(audioBuffer, "audio.mp3");
  
  // Step 4: Merge video and audio (your own service)
  const finalVideo = await mergeVideoAudio(videoUrl, audioUrl);
  
  return finalVideo;
}
```

**Problems:**

- **150+ lines** for a simple 3-provider workflow
- **Tightly coupled** to each provider's API
- **No retries, timeouts, or error handling**
- **Hard to test** without hitting real APIs
- **Impossible to swap providers** without rewriting everything

## Building Provider Adapters

One approach: build adapters to normalize each provider's API.

```typescript
interface GenerationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: string;
  error?: string;
}

class ReplicateAdapter {
  async submitJob(model: string, input: any): Promise<GenerationJob> {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version: model, input }),
    });
    
    const data = await response.json();
    
    return {
      id: data.id,
      status: this.normalizeStatus(data.status),
      output: data.output?.[0],
    };
  }
  
  async getStatus(jobId: string): Promise<GenerationJob> {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${jobId}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );
    
    const data = await response.json();
    
    return {
      id: data.id,
      status: this.normalizeStatus(data.status),
      output: data.output?.[0],
      error: data.error,
    };
  }
  
  private normalizeStatus(
    status: string
  ): "pending" | "processing" | "completed" | "failed" {
    if (status === "starting") return "pending";
    if (status === "processing") return "processing";
    if (status === "succeeded") return "completed";
    if (status === "failed") return "failed";
    return "pending";
  }
}

class FalAdapter {
  // Similar implementation for Fal
}

class ElevenLabsAdapter {
  // Similar implementation for ElevenLabs
}
```

Now your workflow code looks like this:

```typescript
const replicate = new ReplicateAdapter();
const fal = new FalAdapter();
const elevenLabs = new ElevenLabsAdapter();

async function normalizedWorkflow(prompt: string, narration: string) {
  // Generate image with Fal
  const imageJob = await fal.submitJob("fal-ai/flux/schnell", { prompt });
  const imageUrl = imageJob.output;
  
  // Generate video with Replicate
  const videoJob = await replicate.submitJob("animate-diff-id", {
    path: imageUrl,
  });
  
  // Poll for video completion
  let videoUrl: string | null = null;
  while (!videoUrl) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const status = await replicate.getStatus(videoJob.id);
    if (status.status === "completed") videoUrl = status.output!;
    if (status.status === "failed") throw new Error(status.error);
  }
  
  // Generate audio with ElevenLabs
  const audioJob = await elevenLabs.submitJob("voice-id", { text: narration });
  const audioUrl = audioJob.output;
  
  return { videoUrl, audioUrl };
}
```

**Better, but:**

- You still have **100+ lines of adapter code**
- Polling logic is still manual
- No retries, progress tracking, or orchestration
- Adding a new provider means writing another adapter

## The Unified Workflow Approach

Instead of building adapters, use a system that already supports all three providers with a unified API:

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  generateAudio,
  imageModel,
  videoModel,
  audioModel,
} from "@synthome/sdk";

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

- **Fal and Replicate** used in the same workflow
- **No polling logic**—handled automatically
- **No provider-specific code**—unified API
- **Automatic retries** for transient failures

### Adding ElevenLabs

Let's add voiceover audio:

```typescript
const result = await compose(
  captions({
    video: generateVideo({
      image: generateImage({
        model: imageModel("fal-ai/flux/schnell", "fal"),
        prompt: "A serene mountain landscape at sunrise",
      }),
      model: videoModel("lucataco/animate-diff", "replicate"),
    }),
    audio: generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "Welcome to the mountains, where peace and beauty converge.",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    }),
  })
).execute();
```

Now we're using **all three providers** in a single workflow:

1. **Fal** generates the image
2. **Replicate** animates it into a video
3. **ElevenLabs** generates the voiceover
4. **Captions** syncs the audio with the video

**Total code:** 15 lines.

**No custom code for:**
- Authentication
- Polling
- Status checking
- Error handling
- Format conversion
- CDN uploads

## API Key Management

When using multiple providers, you need to manage API keys. You have three options:

### Option 1: Environment Variables

```bash
export REPLICATE_API_KEY="your-replicate-key"
export FAL_KEY="your-fal-key"
export ELEVENLABS_API_KEY="your-elevenlabs-key"
```

The SDK automatically reads these when executing pipelines.

### Option 2: Dashboard Storage

Add your API keys to the Synthome dashboard. They're stored securely and used automatically for all executions.

```typescript
// No API keys in code
const result = await pipeline.execute();
```

### Option 3: Pass in Code

Provide API keys directly in your code:

```typescript
const result = await pipeline.execute({
  providerApiKeys: {
    replicate: "your-replicate-key",
    fal: "your-fal-key",
    elevenlabs: "your-elevenlabs-key",
  },
});
```

**Priority order:** Code → Dashboard → Environment variables.

## Real-World Multi-Provider Workflow

Let's build something practical: a social media video generator that uses all three providers.

**Requirements:**
- Generate 3 images (Fal—fastest)
- Animate each into a 5-second clip (Replicate—best models)
- Add voiceover narration (ElevenLabs—best quality)
- Merge everything into a final video

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  generateAudio,
  merge,
  captions,
  imageModel,
  videoModel,
  audioModel,
} from "@synthome/sdk";

async function createSocialMediaVideo(
  scenes: string[],
  narration: string
) {
  const result = await compose(
    captions({
      video: merge(
        scenes.map(prompt =>
          generateVideo({
            image: generateImage({
              model: imageModel("fal-ai/flux/schnell", "fal"),
              prompt,
              imageSize: "landscape_16_9",
            }),
            model: videoModel("lucataco/animate-diff", "replicate"),
            duration: 5,
          })
        )
      ),
      audio: generateAudio({
        model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
        text: narration,
        voiceId: "EXAVITQu4vr4xnSDxMaL",
      }),
    })
  ).execute();
  
  return result.result?.url;
}

// Usage
const videoUrl = await createSocialMediaVideo(
  [
    "A bustling city at dawn, cinematic lighting",
    "People working in a modern office, natural light",
    "A product showcase on a wooden desk, soft shadows",
  ],
  "Introducing the future of productivity. Built for teams who move fast."
);

console.log("Video ready:", videoUrl);
```

[DIAGRAM: Workflow showing three parallel branches for image generation (all using Fal), feeding into three parallel video generations (all using Replicate), merging together, then audio generation (ElevenLabs) runs in parallel, finally captions sync everything]

**What's happening:**

1. **Three images generate in parallel** (Fal)
2. **Three videos generate in parallel** (Replicate, each waiting for its image)
3. **Audio generates in parallel** with the videos (ElevenLabs)
4. **Merge waits for all videos**, combines them
5. **Captions syncs audio with the merged video**

**Execution time:** ~60 seconds (parallelized)

**Without parallelization:** ~180 seconds (sequential)

## Switching Providers

Need to switch a model to a different provider? Change one string:

**Before (Replicate):**
```typescript
videoModel("lucataco/animate-diff", "replicate")
```

**After (Fal):**
```typescript
videoModel("fal-ai/fast-animatediff", "fal")
```

No other code changes. No new polling logic. No new error handling.

## Handling Provider-Specific Options

Different providers have different options. The SDK exposes them in a type-safe way:

```typescript
// Replicate-specific options
generateVideo({
  model: videoModel("lucataco/animate-diff", "replicate"),
  image: imageUrl,
  seed: 123456,
  steps: 25,
  guidanceScale: 7.5,
})

// Fal-specific options
generateImage({
  model: imageModel("fal-ai/flux/schnell", "fal"),
  prompt: "A sunset",
  imageSize: "landscape_16_9",
  numInferenceSteps: 4,
})

// ElevenLabs-specific options
generateAudio({
  model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
  text: "Hello world",
  voiceId: "voice-id",
  stability: 0.5,
  similarityBoost: 0.75,
})
```

TypeScript autocomplete works for provider-specific options.

## Error Handling Across Providers

When using multiple providers, errors can come from anywhere:

```typescript
try {
  const result = await compose(
    generateVideo({
      image: generateImage({
        model: imageModel("fal-ai/flux/schnell", "fal"),
        prompt: "A sunset",
      }),
      model: videoModel("lucataco/animate-diff", "replicate"),
    })
  ).execute();
} catch (error) {
  if (error.provider === "fal") {
    console.error("Fal error:", error.message);
  } else if (error.provider === "replicate") {
    console.error("Replicate error:", error.message);
  }
}
```

Errors include:
- Which provider failed
- What operation failed
- Whether it's retryable
- The raw error from the provider

## Cost Comparison: Replicate vs Fal vs ElevenLabs

Different providers have different pricing models:

**Replicate:**
- Pay per second of compute time
- Varies by model (GPU type)
- Example: AnimateDiff ~$0.01-0.03 per video

**Fal:**
- Pay per inference
- Optimized for speed (premium pricing)
- Example: Flux Schnell ~$0.003 per image

**ElevenLabs:**
- Pay per character of generated audio
- Tiered pricing based on voice quality
- Example: Turbo v2.5 ~$0.00015 per character

**For our workflow (3 images, 3 videos, 1 audio):**
- Fal: 3 × $0.003 = $0.009
- Replicate: 3 × $0.02 = $0.06
- ElevenLabs: 100 chars × $0.00015 = $0.015

**Total:** ~$0.084 per video

Using a unified workflow doesn't increase costs—you're still paying each provider directly.

## When to Use Multiple Providers

**Use multiple providers when:**

- You need the best model for each task (Fal for speed, Replicate for variety, ElevenLabs for audio quality)
- You want redundancy (if one provider is down, switch to another)
- Different models are only available on specific providers

**Stick to one provider when:**

- You're prototyping and don't want to manage multiple API keys
- Your use case fits entirely within one provider's offerings
- You want simpler debugging (fewer moving parts)

## Wrapping Up

Combining Replicate, Fal, and ElevenLabs into a single workflow is powerful but complex. Each provider has different APIs, async patterns, and response formats.

You can:

1. **Write raw integration code** (150+ lines, hard to maintain)
2. **Build provider adapters** (100+ lines, still manual orchestration)
3. **Use a unified SDK** (15 lines, automatic orchestration)

The unified approach doesn't just reduce code—it adds production features like retries, progress tracking, and async execution that would take weeks to build yourself.

**Key takeaways:**

- Different providers excel at different tasks
- Provider-specific APIs are incompatible by default
- Abstraction layers normalize differences
- Unified workflows enable cross-provider orchestration
- Switching providers becomes trivial with canonical model names

Start by choosing the best provider for each operation, then build a workflow that chains them together. Let the orchestration layer handle polling, retries, and state tracking.

---

**Further reading:**

- Learn how to build a production AI video backend
- Explore provider selection strategies for cost optimization
- Understand rate limiting and retry strategies across multiple providers
