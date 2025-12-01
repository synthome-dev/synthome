# A Beginner's Guide to Building AI Apps with TypeScript

TypeScript has become the go-to language for building AI applications, combining type safety with JavaScript's ecosystem. This guide walks you through building your first AI app—from calling model APIs to orchestrating multi-step workflows—using TypeScript best practices and modern tooling.

---

## Why TypeScript for AI Development?

TypeScript offers unique advantages for AI applications:

**Type safety catches errors early:**
```typescript
// This fails at compile time, not runtime
generateVideo({
  prompt: "A sunset",
  duration: "five seconds",  // ❌ Type error: expected number
});
```

**Autocomplete for model parameters:**
```typescript
// Your IDE suggests available options
videoModel("animate-diff", "replicate").
  // ↓ Autocomplete shows: seed, steps, guidanceScale, etc.
```

**Async/await for AI workflows:**
```typescript
// Clean, readable async code
const image = await generateImage({ prompt: "A sunset" });
const video = await generateVideo({ image });
```

**Rich ecosystem:**
- npm packages for every AI provider
- Node.js for server-side execution
- Edge runtime support (Vercel, Cloudflare)
- Full-stack frameworks (Next.js, SvelteKit)

## Setting Up Your TypeScript AI Project

Start with a basic TypeScript project:

```bash
mkdir ai-app
cd ai-app
npm init -y
npm install typescript @types/node tsx
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

Create `src/index.ts`:

```typescript
console.log("Hello, AI!");
```

Run with `tsx`:

```bash
npx tsx src/index.ts
```

## Your First AI API Call

Let's call an AI model API manually to understand the basics.

### Text-to-Image Generation

```typescript
// src/generate-image.ts
async function generateImage(prompt: string): Promise<string> {
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
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.images[0].url;
}

// Usage
const imageUrl = await generateImage("A serene mountain landscape");
console.log("Image URL:", imageUrl);
```

**What we did:**
- Made an HTTP POST request to Fal's API
- Included API key in headers
- Sent prompt as JSON
- Extracted image URL from response

### Adding Type Safety

Let's add types for better developer experience:

```typescript
interface ImageGenerationRequest {
  prompt: string;
  image_size?: "square" | "portrait_4_3" | "landscape_16_9";
  num_inference_steps?: number;
}

interface ImageGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

async function generateImage(
  params: ImageGenerationRequest
): Promise<string> {
  const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }
  
  const data: ImageGenerationResponse = await response.json();
  return data.images[0].url;
}

// Now we have autocomplete and type checking
const url = await generateImage({
  prompt: "A sunset",
  image_size: "landscape_16_9",  // ✓ Autocomplete works
  // num_inference_steps: "ten",  // ❌ Type error
});
```

## Handling Async AI Operations

Most AI models are asynchronous—you submit a job, then poll for completion.

### Polling Pattern

```typescript
interface AsyncJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  output?: string;
  error?: string;
}

async function pollUntilComplete(jobId: string): Promise<string> {
  while (true) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${jobId}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );
    
    const job: AsyncJob = await response.json();
    
    if (job.status === "completed") {
      return job.output!;
    }
    
    if (job.status === "failed") {
      throw new Error(`Job failed: ${job.error}`);
    }
    
    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Video Generation with Polling

```typescript
async function generateVideo(prompt: string): Promise<string> {
  // Submit job
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "lucataco/animate-diff:...",
      input: { prompt },
    }),
  });
  
  const job = await response.json();
  
  // Poll for completion
  const videoUrl = await pollUntilComplete(job.id);
  
  return videoUrl;
}
```

## Building a Multi-Step Pipeline

Real AI apps chain multiple models together. Let's build an image-to-video pipeline:

```typescript
interface Pipeline {
  imageUrl: string;
  videoUrl: string;
}

async function createVideoPipeline(prompt: string): Promise<Pipeline> {
  console.log("Step 1: Generating image...");
  const imageUrl = await generateImage({ prompt });
  console.log("Image complete:", imageUrl);
  
  console.log("Step 2: Animating image...");
  const videoUrl = await generateVideo(imageUrl);
  console.log("Video complete:", videoUrl);
  
  return { imageUrl, videoUrl };
}

// Usage
const result = await createVideoPipeline(
  "A peaceful forest in autumn, cinematic"
);

console.log("Pipeline complete!");
console.log("Image:", result.imageUrl);
console.log("Video:", result.videoUrl);
```

### Adding Error Handling

Production apps need robust error handling:

```typescript
class AIError extends Error {
  constructor(
    message: string,
    public provider: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = "AIError";
  }
}

async function generateImageSafe(
  params: ImageGenerationRequest
): Promise<string> {
  try {
    return await generateImage(params);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new AIError("Network error", "fal", true);
    }
    
    if (error.response?.status === 429) {
      throw new AIError("Rate limit exceeded", "fal", true);
    }
    
    throw new AIError("Image generation failed", "fal", false);
  }
}

async function createVideoPipelineWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<Pipeline> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createVideoPipeline(prompt);
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof AIError && !error.retryable) {
        throw error;  // Don't retry permanent failures
      }
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError!;
}
```

## Using an AI SDK

Manually calling APIs works, but SDKs simplify everything:

```bash
npm install @synthome/sdk
```

### Basic Generation

```typescript
import { compose, generateImage, imageModel } from "@synthome/sdk";

const execution = await compose(
  generateImage({
    model: imageModel("fal-ai/flux/schnell", "fal"),
    prompt: "A serene mountain landscape",
  })
).execute();

console.log("Image URL:", execution.result?.url);
```

**Benefits:**
- No polling logic
- Automatic retries
- Type-safe model parameters
- Unified API across providers

### Building Pipelines

```typescript
import { generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    image: generateImage({
      model: imageModel("fal-ai/flux/schnell", "fal"),
      prompt: "A peaceful forest in autumn",
    }),
    model: videoModel("lucataco/animate-diff", "replicate"),
  })
).execute();

console.log("Video URL:", execution.result?.url);
```

The SDK handles:
- Image generation first
- Video generation waits for image automatically
- Polling for both operations
- Error handling and retries

### Progress Tracking

```typescript
const execution = await compose(
  generateVideo({ ... })
).execute();

console.log(`Progress: ${execution.progress}%`);
console.log(`Status: ${execution.status}`);
console.log(`Current job: ${execution.currentJob}`);
```

## Practical Example: Social Media Video Generator

Let's build a complete app that generates social media videos:

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  merge,
  imageModel,
  videoModel,
} from "@synthome/sdk";

interface VideoRequest {
  scenes: string[];  // Text descriptions
  duration: number;  // Per scene
}

async function generateSocialVideo(
  request: VideoRequest
): Promise<string> {
  console.log(`Generating ${request.scenes.length} scenes...`);
  
  const execution = await compose(
    merge(
      request.scenes.map(prompt =>
        generateVideo({
          image: generateImage({
            model: imageModel("fal-ai/flux/schnell", "fal"),
            prompt,
            imageSize: "square",  // 1:1 for social media
          }),
          model: videoModel("lucataco/animate-diff", "replicate"),
          duration: request.duration,
        })
      )
    )
  ).execute();
  
  console.log("Video complete!");
  return execution.result!.url;
}

// Usage
const videoUrl = await generateSocialVideo({
  scenes: [
    "A coffee cup on a wooden desk, warm lighting",
    "Hands typing on a laptop keyboard, productivity",
    "A finished product design on screen, satisfaction",
  ],
  duration: 3,
});

console.log("Share your video:", videoUrl);
```

**What happens:**
1. Three images generate in parallel (Fal)
2. Three videos generate in parallel (Replicate)
3. Videos merge into one (automatic)
4. Final URL returned

**Execution time:** ~60 seconds (parallelized)

## Environment Setup Best Practices

### Managing API Keys

Use environment variables:

```bash
# .env
FAL_KEY="your-fal-key"
REPLICATE_API_KEY="your-replicate-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
```

Load with `dotenv`:

```typescript
import "dotenv/config";

console.log(process.env.FAL_KEY);  // Available everywhere
```

### TypeScript Configuration for AI Apps

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Project Structure

```
ai-app/
├── src/
│   ├── index.ts           # Entry point
│   ├── generators/        # AI generation functions
│   │   ├── image.ts
│   │   ├── video.ts
│   │   └── audio.ts
│   ├── pipelines/         # Multi-step workflows
│   │   └── social-video.ts
│   ├── types/             # Type definitions
│   │   └── models.ts
│   └── utils/             # Helpers
│       ├── retry.ts
│       └── cache.ts
├── .env                   # API keys (gitignored)
├── tsconfig.json
└── package.json
```

## Testing AI Applications

Testing AI apps is tricky—you don't want to call real APIs in tests.

### Mocking API Calls

```typescript
// src/__tests__/generate-image.test.ts
import { vi, describe, it, expect } from "vitest";

// Mock fetch
global.fetch = vi.fn();

describe("generateImage", () => {
  it("should return image URL", async () => {
    // Setup mock response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        images: [{ url: "https://example.com/image.jpg" }],
      }),
    });
    
    const url = await generateImage({ prompt: "A sunset" });
    
    expect(url).toBe("https://example.com/image.jpg");
    expect(fetch).toHaveBeenCalledWith(
      "https://fal.run/fal-ai/flux/schnell",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
```

### Integration Tests

For integration tests, use test API keys and small/fast models:

```typescript
describe("integration: video pipeline", () => {
  it("should generate video from prompt", async () => {
    const result = await createVideoPipeline("Test prompt");
    
    expect(result.imageUrl).toMatch(/^https:\/\//);
    expect(result.videoUrl).toMatch(/^https:\/\//);
  }, 120000);  // 2-minute timeout
});
```

## Deployment Options

### Node.js Server

```typescript
// src/server.ts
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/generate-video", async (req, res) => {
  const { prompt } = req.body;
  
  try {
    const result = await createVideoPipeline(prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

### Serverless (Vercel/Netlify)

```typescript
// api/generate-video.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { prompt } = req.body;
  
  const result = await createVideoPipeline(prompt);
  
  res.json(result);
}
```

### Edge Runtime (Cloudflare Workers)

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const { prompt } = await request.json();
    
    const result = await createVideoPipeline(prompt);
    
    return Response.json(result);
  },
};
```

## Common Patterns and Gotchas

### Pattern: Caching Results

```typescript
const cache = new Map<string, string>();

async function generateImageCached(prompt: string): Promise<string> {
  if (cache.has(prompt)) {
    console.log("Cache hit!");
    return cache.get(prompt)!;
  }
  
  const url = await generateImage({ prompt });
  cache.set(prompt, url);
  
  return url;
}
```

### Pattern: Parallel Execution

```typescript
// ❌ Bad: Sequential (slow)
const img1 = await generateImage({ prompt: "Scene 1" });
const img2 = await generateImage({ prompt: "Scene 2" });
const img3 = await generateImage({ prompt: "Scene 3" });

// ✅ Good: Parallel (fast)
const [img1, img2, img3] = await Promise.all([
  generateImage({ prompt: "Scene 1" }),
  generateImage({ prompt: "Scene 2" }),
  generateImage({ prompt: "Scene 3" }),
]);
```

### Gotcha: Timeout Handling

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

// Usage
const result = await withTimeout(
  generateVideo(prompt),
  180000  // 3-minute timeout
);
```

## Next Steps

You now know how to build AI applications with TypeScript:

- Call AI model APIs with type safety
- Handle async operations and polling
- Build multi-step pipelines
- Use SDKs for simplified workflows
- Test and deploy your apps

**To go deeper:**

- Explore more advanced pipeline patterns (branching, conditional logic)
- Learn about webhook integration for async workflows
- Study cost optimization strategies
- Build full-stack AI apps with Next.js

Start simple (generate one image), then build up to complex multi-model pipelines. TypeScript's type system will guide you and catch errors early.

---

**Code examples:** All examples are on GitHub: [link]
