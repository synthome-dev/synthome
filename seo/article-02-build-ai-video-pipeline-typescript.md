# How to Build an AI Video Pipeline in TypeScript (Step-by-Step)

Building an AI video pipeline from scratch means dealing with async APIs, polling loops, provider quirks, and orchestration headaches. This tutorial walks through building a TypeScript video generation pipeline—first with raw HTTP calls to show the pain, then with abstractions to show what's possible.

---

## What We're Building

We're building a TypeScript pipeline that:

1. Generates an image from a text prompt (text-to-image)
2. Animates that image into a video clip (image-to-video)
3. Generates voiceover audio (text-to-speech)
4. Merges the video and audio into a final output

This is a common pattern for AI-generated content: start with static media, animate it, add audio, and deliver a finished video.

By the end, you'll understand:
- How to call AI model APIs directly
- Why raw API calls become unmanageable
- How abstractions simplify multimodal pipelines

## Prerequisites

You'll need:

- **Node.js 18+** or **Bun** (for TypeScript execution)
- **API keys** for:
  - Fal (for image generation)
  - Replicate (for video generation)
  - ElevenLabs (for text-to-speech)
- Basic TypeScript knowledge
- Familiarity with async/await

Set up your environment:

```bash
npm install node-fetch
```

Create a `.env` file:

```bash
FAL_KEY="your-fal-key"
REPLICATE_API_KEY="your-replicate-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
```

## Step 1 — Generate an Image (Text-to-Image)

First, we'll generate an image using Fal's API. This will become the first frame of our video.

```typescript
import fetch from "node-fetch";

async function generateImage(prompt: string): Promise<string> {
  console.log("Generating image...");
  
  // Submit the generation job
  const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Fal's Flux model returns results immediately (no polling needed)
  const imageUrl = data.images[0].url;
  
  console.log("Image generated:", imageUrl);
  return imageUrl;
}
```

**What's happening:**
- We're calling Fal's Flux Schnell model (fast text-to-image)
- The API returns the image URL directly (no polling)
- We specify `landscape_16_9` to match video aspect ratios

**Try it:**

```typescript
const imageUrl = await generateImage("A serene mountain landscape at sunrise, cinematic lighting");
console.log(imageUrl);
```

## Step 2 — Animate the Image (Image-to-Video)

Now we'll animate that image using Replicate's video generation API. This is where async complexity starts.

```typescript
interface ReplicateJob {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed";
  output?: string[];
  error?: string;
}

async function generateVideo(imageUrl: string): Promise<string> {
  console.log("Generating video from image...");
  
  // Step 1: Submit the video generation job
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "lucataco/animate-diff:1531004ee4c98894ab11f8a4ce6206099e732c1da15121987a8eef54828f0663",
      input: {
        path: imageUrl,
        seed: 255224557,
        steps: 25,
        guidance_scale: 7.5,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Video generation failed: ${response.statusText}`);
  }
  
  const job: ReplicateJob = await response.json();
  
  // Step 2: Poll until the job completes
  let videoUrl: string | null = null;
  
  while (!videoUrl) {
    // Wait 3 seconds before checking status
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${job.id}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );
    
    const status: ReplicateJob = await statusResponse.json();
    
    console.log(`Video status: ${status.status}`);
    
    if (status.status === "succeeded") {
      videoUrl = status.output![0];
    } else if (status.status === "failed") {
      throw new Error(`Video generation failed: ${status.error}`);
    }
  }
  
  console.log("Video generated:", videoUrl);
  return videoUrl;
}
```

**What's happening:**
- We submit a job and get a job ID back
- We poll every 3 seconds to check if the job is done
- Video generation typically takes 30-60 seconds
- If it fails, we throw an error (no retry logic yet)

**The pain points:**
- Manual polling loop
- Hard-coded 3-second delay (too fast wastes API calls, too slow feels unresponsive)
- No timeout handling (what if it takes 10 minutes?)
- No retry logic for transient failures

## Step 3 — Add Audio (Text-to-Speech)

Let's generate voiceover audio using ElevenLabs:

```typescript
async function generateAudio(text: string): Promise<string> {
  console.log("Generating voiceover...");
  
  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Audio generation failed: ${response.statusText}`);
  }
  
  // ElevenLabs returns audio data directly (not a URL)
  const audioBuffer = await response.arrayBuffer();
  
  // You'd typically upload this to your CDN
  // For now, we'll simulate with a placeholder
  const audioUrl = await uploadToCDN(audioBuffer, "audio.mp3");
  
  console.log("Audio generated:", audioUrl);
  return audioUrl;
}

async function uploadToCDN(buffer: ArrayBuffer, filename: string): Promise<string> {
  // Simulate CDN upload (in production, use S3/R2/etc)
  // This would be a real upload in production:
  // const result = await s3.putObject({ Bucket, Key: filename, Body: buffer });
  // return `https://cdn.example.com/${filename}`;
  
  return `https://cdn.example.com/${filename}`;
}
```

**What's happening:**
- ElevenLabs returns audio data synchronously (no polling)
- We get raw audio bytes, not a URL
- We need to upload to our own CDN to get a public URL

**Different patterns:**
- Fal: immediate URL response
- Replicate: async job with polling
- ElevenLabs: immediate binary response

Each provider has different patterns. Your pipeline code needs to handle all of them.

## Step 4 — Merge Video and Audio

Finally, we combine the video and audio. This typically requires FFmpeg or a media processing service:

```typescript
async function mergeVideoAudio(videoUrl: string, audioUrl: string): Promise<string> {
  console.log("Merging video and audio...");
  
  // Option 1: Use FFmpeg locally (requires FFmpeg installed)
  // exec(`ffmpeg -i ${videoUrl} -i ${audioUrl} -c:v copy -c:a aac output.mp4`);
  
  // Option 2: Use a media processing API (more scalable)
  const response = await fetch("https://api.your-media-service.com/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video: videoUrl,
      audio: audioUrl,
    }),
  });
  
  const data = await response.json();
  const finalVideoUrl = data.url;
  
  console.log("Final video:", finalVideoUrl);
  return finalVideoUrl;
}
```

**Challenges:**
- FFmpeg requires server-side execution (doesn't work in edge/serverless)
- Media processing APIs add another async operation to manage
- Duration mismatches cause sync issues (audio longer than video, etc.)

## The Full Raw Implementation

Here's the complete pipeline tied together:

```typescript
interface PipelineResult {
  imageUrl: string;
  videoUrl: string;
  audioUrl: string;
  finalVideoUrl: string;
}

async function buildVideoPipeline(
  imagePrompt: string,
  narration: string
): Promise<PipelineResult> {
  try {
    // Step 1: Generate image
    const imageUrl = await generateImage(imagePrompt);
    
    // Step 2: Animate image to video
    const videoUrl = await generateVideo(imageUrl);
    
    // Step 3: Generate audio
    const audioUrl = await generateAudio(narration);
    
    // Step 4: Merge video and audio
    const finalVideoUrl = await mergeVideoAudio(videoUrl, audioUrl);
    
    return {
      imageUrl,
      videoUrl,
      audioUrl,
      finalVideoUrl,
    };
  } catch (error) {
    console.error("Pipeline failed:", error);
    throw error;
  }
}

// Run the pipeline
buildVideoPipeline(
  "A serene mountain landscape at sunrise, cinematic lighting",
  "Welcome to the mountains, where peace and beauty converge."
)
  .then(result => {
    console.log("Pipeline complete!");
    console.log("Final video:", result.finalVideoUrl);
  })
  .catch(error => {
    console.error("Pipeline failed:", error.message);
  });
```

[DIAGRAM: Flow chart showing the sequential execution: Text → Image generation (Fal) → Video generation with polling loop (Replicate) → Audio generation (ElevenLabs) → Merge operation → Final video, with error handling branches at each step]

**Total code:** ~150 lines for a 4-step pipeline.

## Why This Approach Breaks in Production

This raw implementation has serious problems:

### 1. No Retry Logic

Transient failures (network issues, rate limits, temporary provider outages) crash the entire pipeline. If video generation fails at Step 2, you've already paid for image generation at Step 1.

### 2. No Progress Tracking

Users see nothing between "started" and "done". For a 2-minute pipeline, that's bad UX.

### 3. Tight Coupling

Changing providers means rewriting API calls, polling logic, and error handling. Want to switch from Replicate to Fal? Good luck.

### 4. No Parallelization

Everything runs sequentially, even when it doesn't need to. If you're generating multiple videos, they execute one at a time.

### 5. No State Persistence

If your server crashes mid-pipeline, you lose everything. No way to resume or inspect what happened.

### 6. No Timeout Handling

What if video generation hangs indefinitely? Your polling loop runs forever.

### 7. Hard to Test

How do you test this without calling real APIs and paying for each test run?

## Building the Same Pipeline with Abstraction

Now let's build the same pipeline using a composable SDK. Here's the entire implementation:

```typescript
import { compose, generateImage, generateVideo, imageModel, videoModel } from "@synthome/sdk";

async function buildVideoPipelineAbstracted(
  imagePrompt: string,
  narration: string
) {
  const result = await compose(
    generateVideo({
      image: generateImage({
        model: imageModel("fal-ai/flux/schnell", "fal"),
        prompt: imagePrompt,
        imageSize: "landscape_16_9",
      }),
      model: videoModel("lucataco/animate-diff", "replicate"),
      seed: 255224557,
      steps: 25,
      guidanceScale: 7.5,
    })
  ).execute();
  
  return result.result?.url;
}

// Run the pipeline
const videoUrl = await buildVideoPipelineAbstracted(
  "A serene mountain landscape at sunrise, cinematic lighting",
  "Welcome to the mountains, where peace and beauty converge."
);

console.log("Final video:", videoUrl);
```

**That's it.** 15 lines instead of 150.

### What the SDK Handles

**Automatic orchestration:**
- Image generation runs first
- Video generation waits for the image, then runs
- No manual polling—the SDK handles it

**Error handling:**
- Transient failures retry automatically
- Permanent failures return actionable errors
- No manual try/catch for each operation

**Progress tracking:**
```typescript
const execution = await pipeline.execute();

// Check progress
console.log(`Progress: ${execution.progress}%`);
console.log(`Current job: ${execution.currentJob}`);
console.log(`Status: ${execution.status}`);
```

**Async execution with webhooks:**
```typescript
const execution = await pipeline.execute({
  webhook: "https://your-server.com/webhook"
});

// Returns immediately with execution ID
console.log("Execution ID:", execution.id);
```

Your webhook receives the result when done—no polling needed on your end.

**Provider abstraction:**
```typescript
// Switch from Replicate to Fal by changing one string
videoModel("lucataco/animate-diff", "replicate")  // Before
videoModel("fal-ai/fast-animatediff", "fal")      // After
```

No code changes beyond the model identifier.

## Comparison: Raw vs Abstracted

| Aspect | Raw Implementation | Abstracted (SDK) |
|--------|-------------------|------------------|
| **Lines of code** | ~150 | ~15 |
| **Polling logic** | Manual loops | Automatic |
| **Error handling** | Manual try/catch | Built-in retries |
| **Progress tracking** | Custom logging | Built-in |
| **Provider switching** | Rewrite API calls | Change model string |
| **Parallel execution** | Manual `Promise.all()` | Automatic |
| **State persistence** | None | Built-in |
| **Timeout handling** | Custom timers | Automatic |
| **Testing** | Hit real APIs | Mock execution layer |

The SDK doesn't just reduce code—it makes production-grade features (retries, observability, async execution) accessible without custom infrastructure.

## Adding Complexity

Need to generate multiple videos in parallel?

**Raw approach:** Manage `Promise.all()`, track each polling loop, handle partial failures.

**Abstracted approach:**
```typescript
const result = await compose(
  merge([
    generateVideo({ prompt: "Scene 1" }),
    generateVideo({ prompt: "Scene 2" }),
    generateVideo({ prompt: "Scene 3" }),
  ])
).execute();
```

All three videos generate in parallel. The merge waits for all to complete before combining them.

Need to add captions?

```typescript
const result = await compose(
  captions({
    video: generateVideo({ ... }),
    model: audioModel("incredibly-fast-whisper", "replicate"),
  })
).execute();
```

The SDK handles transcription, subtitle generation, and burning them into the video.

## Next Steps

You've seen how to build an AI video pipeline in TypeScript—both with raw API calls and with abstractions.

**If you're building a prototype:**
Start with raw APIs to understand how each provider works. It's educational.

**If you're building for production:**
Use abstractions. Orchestration, retries, observability, and state management aren't things you want to build from scratch.

**Key takeaways:**
- Multimodal pipelines involve more orchestration than generation
- Each AI provider has different async patterns
- Abstractions reduce code and add production features
- Composable operations scale better than monolithic functions

**Further reading:**
- Learn how to chain multiple AI models together
- Explore webhook patterns for async video processing
- Understand error handling strategies in AI pipelines

---

**Code Repository:** You can find the full raw implementation and abstracted examples on GitHub: [link]
