# How to Generate Videos with AI Agents: Step-by-Step Tutorial

> **TL;DR:** This tutorial walks you through generating AI videos from scratch using Synthome. You'll learn text-to-video, image-to-video, lip-sync videos, multi-scene production, and adding captions—with complete code examples you can copy and run.

## What You'll Learn

By the end of this tutorial, you'll be able to:

1. Set up Synthome SDK and configure API keys
2. Generate videos from text prompts
3. Animate images into videos
4. Create talking head videos with lip-sync
5. Build multi-scene videos with merging
6. Add auto-generated captions
7. Handle async workflows with webhooks

**Time to complete:** 30-45 minutes

**Prerequisites:** Basic TypeScript/JavaScript knowledge

---

## Step 1: Set Up Your Environment

### 1.1 Install the SDK

Create a new project or use an existing one:

```bash
mkdir ai-video-tutorial
cd ai-video-tutorial
npm init -y
npm install @synthome/sdk typescript tsx
```

### 1.2 Get Your API Keys

You'll need two types of keys:

1. **Synthome API Key** - Orchestrates your pipelines
2. **Provider API Keys** - For the AI models (Replicate, Fal, ElevenLabs)

**Get your Synthome API key:**

1. Go to [synthome.dev](https://synthome.dev)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key

**Get provider API keys:**

- **Replicate:** [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
- **Fal:** [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
- **ElevenLabs:** [elevenlabs.io/app/settings/api-keys](https://elevenlabs.io/app/settings/api-keys)

### 1.3 Configure Environment Variables

Create a `.env` file:

```bash
# Required
SYNTHOME_API_KEY=your-synthome-api-key

# Provider keys (add the ones you need)
REPLICATE_API_KEY=your-replicate-key
FAL_KEY=your-fal-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

> **Alternative:** Configure provider keys in your [Synthome dashboard](https://synthome.dev) for centralized management. Dashboard keys take precedence over environment variables.

### 1.4 Create Your First Script

Create `generate-video.ts`:

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

async function main() {
  console.log("Generating video...");

  const execution = await compose(
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "A serene mountain lake at sunrise, mist rising from the water",
      duration: 5,
      aspectRatio: "16:9",
    }),
  ).execute();

  console.log("Video URL:", execution.result?.url);
}

main().catch(console.error);
```

Run it:

```bash
npx tsx generate-video.ts
```

You should see a video URL in the output after 30-60 seconds.

---

## Step 2: Text-to-Video Generation

Now let's explore text-to-video in depth.

### 2.1 Basic Text-to-Video

The simplest form—describe what you want:

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt:
      "A golden retriever running through a field of wildflowers, slow motion, cinematic",
    duration: 5,
  }),
).execute();

console.log("Video:", execution.result?.url);
```

### 2.2 Understanding Video Options

Here are all the options you can configure:

| Option        | Type         | Description                   | Example                                               |
| ------------- | ------------ | ----------------------------- | ----------------------------------------------------- |
| `model`       | `VideoModel` | Required. The AI model to use | `videoModel("bytedance/seedance-1-pro", "replicate")` |
| `prompt`      | `string`     | Text description of the video | `"A cat playing piano"`                               |
| `duration`    | `number`     | Length in seconds             | `5`                                                   |
| `aspectRatio` | `string`     | Video dimensions ratio        | `"16:9"`, `"9:16"`, `"1:1"`                           |
| `resolution`  | `string`     | Video quality                 | `"480p"`, `"720p"`, `"1080p"`                         |
| `seed`        | `number`     | For reproducible results      | `12345`                                               |

### 2.3 Choosing Aspect Ratios

Match your aspect ratio to the platform:

```typescript
// YouTube / Desktop (16:9)
generateVideo({
  model: videoModel("bytedance/seedance-1-pro", "replicate"),
  prompt: "Your prompt here",
  aspectRatio: "16:9",
});

// TikTok / Instagram Reels / Shorts (9:16)
generateVideo({
  model: videoModel("bytedance/seedance-1-pro", "replicate"),
  prompt: "Your prompt here",
  aspectRatio: "9:16",
});

// Instagram Feed / Twitter (1:1)
generateVideo({
  model: videoModel("bytedance/seedance-1-pro", "replicate"),
  prompt: "Your prompt here",
  aspectRatio: "1:1",
});
```

### 2.4 Writing Better Prompts

The quality of your output depends heavily on your prompt.

**Bad prompt (too vague):**

```
A person walking
```

**Good prompt (specific and detailed):**

```
A young woman in a red dress walking confidently down a cobblestone
street in Paris at sunset, golden hour lighting, shallow depth of field,
cinematic film grain, smooth camera follow shot
```

**Prompt formula:**

```
[Subject] + [Action] + [Setting] + [Lighting] + [Camera/Style] + [Quality modifiers]
```

**Examples:**

```typescript
// Product showcase
const productPrompt = `
  A sleek smartphone rotating slowly on a white pedestal,
  soft studio lighting with subtle reflections,
  minimalist background, 4K commercial quality
`;

// Nature scene
const naturePrompt = `
  Ocean waves crashing against rocky cliffs at sunrise,
  drone shot pulling back to reveal the coastline,
  golden hour lighting, cinematic color grading
`;

// Action scene
const actionPrompt = `
  A sports car drifting around a corner on a mountain road,
  slow motion, dust particles in the air,
  dramatic lighting, professional automotive photography style
`;
```

### 2.5 Using Seeds for Reproducibility

If you like a result and want to recreate it:

```typescript
// First generation
const execution1 = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "A butterfly landing on a flower",
    seed: 42, // Use any number
  }),
).execute();

// Later, same seed = same result
const execution2 = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "A butterfly landing on a flower",
    seed: 42, // Same seed
  }),
).execute();
```

---

## Step 3: Image-to-Video Generation

Animate existing images with motion.

### 3.1 Animate an Image URL

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "Gentle wind blowing, leaves rustling, subtle camera movement",
    image: "https://your-image-url.com/landscape.jpg",
    duration: 5,
  }),
).execute();

console.log("Animated video:", execution.result?.url);
```

### 3.2 Generate Image, Then Animate

Chain operations together—generate an image first, then animate it:

```typescript
import {
  compose,
  generateVideo,
  generateImage,
  videoModel,
  imageModel,
} from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "Waves gently rolling onto the shore, seagulls flying",
    image: generateImage({
      model: imageModel("google/nano-banana", "fal"),
      prompt:
        "A beautiful tropical beach at sunset, palm trees, crystal clear water",
    }),
  }),
).execute();

console.log("Video:", execution.result?.url);
```

**What happens behind the scenes:**

1. Synthome generates the beach image first
2. The image URL is automatically passed to the video model
3. The video model animates it based on your motion prompt

### 3.3 When to Use Image-to-Video

| Use Case              | Why It Works                                          |
| --------------------- | ----------------------------------------------------- |
| **Product photos**    | Start from real product images, add subtle motion     |
| **Hero images**       | Bring static website headers to life                  |
| **Brand consistency** | Use your designed images as starting points           |
| **Art animation**     | Animate illustrations, concept art, or paintings      |
| **More control**      | Get exactly the visual you want, then just add motion |

### 3.4 Tips for Image-to-Video

1. **Use high-resolution source images** (1024x1024 or larger)
2. **Match prompt to image content** - describe motion, not the scene
3. **Start simple** - "subtle movement" works better than complex actions
4. **Avoid people** - face/body animation can look unnatural

```typescript
// ❌ Wrong: Re-describing the image
generateVideo({
  prompt: "A beautiful sunset beach with palm trees",
  image: beachImage,
});

// ✅ Right: Describing the motion to add
generateVideo({
  prompt:
    "Gentle waves lapping at the shore, palm fronds swaying slightly in the breeze",
  image: beachImage,
});
```

[PLACEHOLDER: Image-to-Video Example]

```
Need:
- A source image
- The animation prompt used
- Link to the resulting video
- Before/after or GIF showing the animation
```

---

## Step 4: Lip-Sync Video Generation

Create talking head videos by combining a portrait with audio.

### 4.1 Basic Lip-Sync with Generated Audio

```typescript
import {
  compose,
  generateVideo,
  generateAudio,
  videoModel,
  audioModel,
} from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("veed/fabric-1.0", "fal"),
    image: "https://example.com/portrait.jpg",
    audio: generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "Hello! Welcome to our product demo. Today I'll show you how easy it is to create AI-generated videos with Synthome.",
      voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah - friendly female voice
    }),
  }),
).execute();

console.log("Talking head video:", execution.result?.url);
```

### 4.2 Using Existing Audio

Have your own voiceover? Use it directly:

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("veed/fabric-1.0", "fal"),
    image: "https://example.com/portrait.jpg",
    audio: "https://example.com/my-voiceover.mp3",
  }),
).execute();
```

### 4.3 Choosing the Right Voice

ElevenLabs offers many voices. Here are popular options:

| Voice  | ID                     | Best For                       |
| ------ | ---------------------- | ------------------------------ |
| Sarah  | `EXAVITQu4vr4xnSDxMaL` | Friendly, approachable content |
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Professional, calm narration   |
| Adam   | `pNInz6obpgDQGcFmaJgB` | Authoritative, deep male voice |
| Josh   | `TxGEqnHWrfWFTfGW9XjX` | Casual, conversational male    |

```typescript
// Professional female narrator
generateAudio({
  model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
  text: "Your script here...",
  voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
});

// Authoritative male presenter
generateAudio({
  model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
  text: "Your script here...",
  voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
});
```

### 4.4 Portrait Requirements

For best lip-sync results, your portrait should:

| Requirement            | Why                            | Good Example                |
| ---------------------- | ------------------------------ | --------------------------- |
| **Face forward**       | Model needs clear view of lips | Direct camera eye contact   |
| **Good lighting**      | Shadows confuse the model      | Even, soft lighting on face |
| **Neutral expression** | Easier to animate              | Slight smile or neutral     |
| **High resolution**    | More detail = better results   | 1024x1024 or larger         |
| **Single person**      | One face per image             | Cropped headshot            |

```typescript
// ❌ Avoid
// - Profile shots
// - Multiple people
// - Hands covering mouth
// - Heavy shadows on face
// - Low resolution images

// ✅ Use
// - Professional headshots
// - Well-lit portraits
// - Clear view of mouth and jaw
```

### 4.5 Fast vs Standard Lip-Sync

Need quick iterations? Use the fast model:

```typescript
// Standard quality (recommended for production)
videoModel("veed/fabric-1.0", "fal");

// Fast mode (good for testing)
videoModel("veed/fabric-1.0/fast", "fal");
```

[PLACEHOLDER: Lip-Sync Example]

```
Need:
- Source portrait image
- The script/text used
- Link to resulting talking head video
- Notes on quality/realism
```

---

## Step 5: Multi-Scene Video Creation

Create longer videos by generating multiple scenes and merging them.

### 5.1 Basic Multi-Scene Video

```typescript
import { compose, generateVideo, merge, videoModel } from "@synthome/sdk";

const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt:
        "Scene 1: A rocket on the launch pad, anticipation building, cinematic",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt:
        "Scene 2: The rocket launches with flames and smoke, dramatic angle",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Scene 3: Earth from orbit, the rocket drifts away peacefully",
    }),
  ]),
).execute();

console.log("Merged video:", execution.result?.url);
```

**What happens:**

1. All three videos generate **in parallel** (not sequentially!)
2. The merge waits for all to complete
3. Videos are combined in the order you specified

### 5.2 Mixing Generated and Existing Content

Combine AI-generated scenes with your branded intro/outro:

```typescript
const execution = await compose(
  merge([
    "https://your-cdn.com/branded-intro.mp4", // Your intro
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Main content: Product demonstration, sleek and professional",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Customer testimonial scene: Happy person using the product",
    }),
    "https://your-cdn.com/branded-outro.mp4", // Your outro
  ]),
).execute();
```

### 5.3 Adding Background Music

Add audio tracks with volume control:

```typescript
const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "A peaceful forest scene, morning light filtering through trees",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "A deer drinking from a stream, serene and calm",
    }),
    {
      url: "https://example.com/ambient-music.mp3",
      offset: 0, // Start from beginning
      volume: 0.3, // 30% volume (background)
    },
  ]),
).execute();
```

### 5.4 Merge Options for Audio

Control how audio is added:

```typescript
interface MergeItemWithOptions {
  url: string; // Audio/video URL
  type?: "audio"; // Specify type
  offset?: number; // Start time in seconds
  volume?: number; // 0 to 1 (0% to 100%)
  duration?: number; // Trim to specific length
}
```

Example with voiceover + background music:

```typescript
merge([
  generateVideo({
    /* Scene 1 */
  }),
  generateVideo({
    /* Scene 2 */
  }),
  {
    url: "https://example.com/voiceover.mp3",
    offset: 0,
    volume: 1.0, // Full volume for speech
  },
  {
    url: "https://example.com/background-music.mp3",
    offset: 0,
    volume: 0.2, // Low volume for background
  },
]);
```

### 5.5 Maintaining Visual Consistency

The biggest challenge with multi-scene videos is maintaining a consistent look. Here's how:

```typescript
// Define your style guide once
const styleGuide =
  "cinematic, warm golden hour lighting, shallow depth of field, film grain";

const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: `Scene 1: Office lobby, people walking. ${styleGuide}`,
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: `Scene 2: Team meeting in conference room. ${styleGuide}`,
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: `Scene 3: Developer coding at desk, focused. ${styleGuide}`,
    }),
  ]),
).execute();
```

**Pro tip:** Include the same keywords in every prompt:

- Lighting: "soft lighting", "golden hour", "studio lighting"
- Color: "warm tones", "cool blue tint", "desaturated"
- Camera: "steady cam", "handheld", "drone shot"
- Quality: "4K", "cinematic", "professional"

[PLACEHOLDER: Multi-Scene Example]

```
Need:
- Prompts used for each scene
- Link to the final merged video
- Total generation time
```

---

## Step 6: Adding Captions and Subtitles

Auto-generate captions from video audio using AI transcription.

### 6.1 Auto-Generated Captions

```typescript
import { compose, captions, audioModel } from "@synthome/sdk";

const execution = await compose(
  captions({
    video: "https://example.com/video-with-speech.mp4",
    model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
    style: { preset: "tiktok" },
  }),
).execute();

console.log("Video with captions:", execution.result?.url);
```

### 6.2 Caption Style Presets

Choose a preset that matches your platform:

| Preset      | Description                | Best For               |
| ----------- | -------------------------- | ---------------------- |
| `tiktok`    | Bold, centered, large text | TikTok, Reels, Shorts  |
| `youtube`   | Clean, bottom-positioned   | YouTube, tutorials     |
| `story`     | Vertical-video optimized   | Instagram Stories      |
| `minimal`   | Subtle, unobtrusive        | Professional content   |
| `cinematic` | Film-style subtitles       | Narrative, documentary |

```typescript
// TikTok/Reels style
captions({
  video: myVideo,
  model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
  style: { preset: "tiktok" },
});

// YouTube style
captions({
  video: myVideo,
  model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
  style: { preset: "youtube" },
});
```

### 6.3 Custom Caption Styling

Full control over appearance:

```typescript
captions({
  video: myVideo,
  model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
  style: {
    fontFamily: "Arial",
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    outlineColor: "#000000",
    outlineWidth: 2,
    highlightActiveWord: true,
    activeWordColor: "#FFFF00", // Yellow highlight on current word
    wordsPerCaption: 5,
  },
});
```

### 6.4 Caption Style Options

| Option                | Type          | Description                      |
| --------------------- | ------------- | -------------------------------- |
| `fontFamily`          | string        | Font face                        |
| `fontSize`            | number        | Text size in pixels              |
| `fontWeight`          | string/number | "bold", "normal", or 100-900     |
| `color`               | string        | Text color (hex)                 |
| `outlineColor`        | string        | Stroke color around text         |
| `outlineWidth`        | number        | Stroke width                     |
| `backColor`           | string        | Background color behind text     |
| `highlightActiveWord` | boolean       | Highlight the current word       |
| `activeWordColor`     | string        | Color for highlighted word       |
| `wordsPerCaption`     | number        | How many words shown at once     |
| `maxCaptionDuration`  | number        | Max seconds per caption          |
| `animationStyle`      | string        | "none", "color", "scale", "glow" |

### 6.5 Captions on Generated Video

Full pipeline—generate a talking head, then add captions:

```typescript
const execution = await compose(
  captions({
    video: generateVideo({
      model: videoModel("veed/fabric-1.0", "fal"),
      image: "https://example.com/presenter.jpg",
      audio: generateAudio({
        model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
        text: "Welcome to this tutorial. Today we'll learn about AI video generation.",
        voiceId: "EXAVITQu4vr4xnSDxMaL",
      }),
    }),
    model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
    style: {
      preset: "youtube",
      highlightActiveWord: true,
    },
  }),
).execute();

console.log("Captioned video:", execution.result?.url);
```

---

## Step 7: Advanced Pipeline Patterns

### 7.1 Progress Tracking

Monitor long-running pipelines:

```typescript
const execution = await compose(
  merge([
    generateVideo({
      /* Scene 1 */
    }),
    generateVideo({
      /* Scene 2 */
    }),
    generateVideo({
      /* Scene 3 */
    }),
  ]),
)
  .onProgress((progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Current job: ${progress.currentJob}`);
    console.log(`Completed: ${progress.completedJobs}/${progress.totalJobs}`);
  })
  .execute();
```

### 7.2 Error Handling

Build resilient workflows:

```typescript
try {
  const execution = await compose(
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Your prompt here",
    }),
  )
    .onError((error) => {
      console.error("Pipeline error:", error.message);
      // Log to monitoring service, send alert, etc.
    })
    .execute();

  if (execution.status === "completed") {
    console.log("Success:", execution.result?.url);
  } else if (execution.status === "failed") {
    console.error("Generation failed");
  }
} catch (error) {
  console.error("Unexpected error:", error);
}
```

### 7.3 Async Webhooks

For production, don't wait synchronously. Use webhooks:

```typescript
// Start the pipeline (returns immediately)
const execution = await compose(
  merge([
    generateVideo({
      /* Scene 1 */
    }),
    generateVideo({
      /* Scene 2 */
    }),
    generateVideo({
      /* Scene 3 */
    }),
  ]),
).execute({
  webhook: "https://your-server.com/api/video-complete",
  webhookSecret: "your-secret-for-verification",
});

console.log("Started execution:", execution.id);
// Your webhook receives the result when complete
```

**Webhook handler example (Next.js API route):**

```typescript
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-synthome-signature");

  // Verify signature
  const expectedSig = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.status === "completed") {
    console.log("Video ready:", payload.result.url);
    // Update database, notify user, etc.
  } else if (payload.status === "failed") {
    console.error("Generation failed:", payload.error);
    // Handle failure
  }

  return Response.json({ received: true });
}
```

### 7.4 Polling for Status

Alternative to webhooks—poll for completion:

```typescript
import {
  compose,
  generateVideo,
  videoModel,
  getExecutionStatus,
} from "@synthome/sdk";

// Start execution with webhook (for async)
const execution = await compose(
  generateVideo({
    /* ... */
  }),
).execute({
  webhook: "https://your-server.com/webhook",
});

// Later, check status
const status = await getExecutionStatus(execution.id);

if (status.status === "completed") {
  console.log("Video URL:", status.result?.url);
} else if (status.status === "processing") {
  console.log("Still processing...");
} else if (status.status === "failed") {
  console.error("Failed:", status.error);
}
```

---

## Step 8: Complete Example Project

Let's build a complete video generation application.

### 8.1 Project Structure

```
video-generator/
├── src/
│   ├── index.ts           # Main entry point
│   ├── generate-promo.ts  # Promotional video generator
│   └── types.ts           # TypeScript types
├── .env                   # API keys
├── package.json
└── tsconfig.json
```

### 8.2 Promotional Video Generator

`src/generate-promo.ts`:

```typescript
import {
  compose,
  generateVideo,
  generateImage,
  generateAudio,
  merge,
  captions,
  videoModel,
  imageModel,
  audioModel,
} from "@synthome/sdk";

interface PromoConfig {
  productName: string;
  productDescription: string;
  productImageUrl: string;
  voiceId?: string;
  style?: "professional" | "casual" | "energetic";
}

export async function generatePromoVideo(config: PromoConfig) {
  const {
    productName,
    productDescription,
    productImageUrl,
    voiceId = "EXAVITQu4vr4xnSDxMaL", // Sarah
    style = "professional",
  } = config;

  // Style guides for visual consistency
  const styleGuides = {
    professional: "clean, minimalist, soft studio lighting, corporate",
    casual: "warm, friendly, natural lighting, lifestyle",
    energetic: "dynamic, bold colors, fast pacing, modern",
  };

  const visualStyle = styleGuides[style];

  // Script for the voiceover
  const script = `
    Introducing ${productName}. 
    ${productDescription}
    Try it today and see the difference for yourself.
  `.trim();

  console.log("Starting promotional video generation...");

  const execution = await compose(
    captions({
      video: merge([
        // Scene 1: Product reveal
        generateVideo({
          model: videoModel("bytedance/seedance-1-pro", "replicate"),
          prompt: `Product reveal: ${productName} emerging from soft light, ${visualStyle}`,
          image: productImageUrl,
          duration: 5,
        }),

        // Scene 2: Product in use (generated scene)
        generateVideo({
          model: videoModel("bytedance/seedance-1-pro", "replicate"),
          prompt: `Person using ${productName}, satisfied expression, ${visualStyle}`,
          duration: 5,
        }),

        // Scene 3: Call to action
        generateVideo({
          model: videoModel("bytedance/seedance-1-pro", "replicate"),
          prompt: `${productName} logo on elegant background, ${visualStyle}`,
          image: generateImage({
            model: imageModel("google/nano-banana", "fal"),
            prompt: `Minimalist logo treatment for ${productName}, ${visualStyle}`,
          }),
          duration: 3,
        }),

        // Background music
        {
          url: "https://example.com/upbeat-corporate-music.mp3",
          offset: 0,
          volume: 0.2,
        },

        // Voiceover
        {
          url: generateAudio({
            model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
            text: script,
            voiceId: voiceId,
          }),
          offset: 0.5, // Slight delay before narration starts
          volume: 1.0,
        },
      ]),
      model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
      style: {
        preset: "minimal",
        highlightActiveWord: false,
      },
    }),
  )
    .onProgress((progress) => {
      console.log(`Progress: ${progress.progress}% - ${progress.currentJob}`);
    })
    .execute();

  return {
    videoUrl: execution.result?.url,
    executionId: execution.id,
    status: execution.status,
  };
}
```

### 8.3 Main Entry Point

`src/index.ts`:

```typescript
import { generatePromoVideo } from "./generate-promo";

async function main() {
  const result = await generatePromoVideo({
    productName: "Synthome SDK",
    productDescription:
      "Build AI-powered video pipelines with just a few lines of code.",
    productImageUrl: "https://example.com/synthome-logo.png",
    style: "professional",
  });

  console.log("\n✅ Video generated successfully!");
  console.log("URL:", result.videoUrl);
  console.log("Execution ID:", result.executionId);
}

main().catch(console.error);
```

### 8.4 Run It

```bash
npx tsx src/index.ts
```

[PLACEHOLDER: Complete Example Output]

```
Need:
- Actual output from running this example
- Generated video link
- Total generation time
- Any notes on the result quality
```

---

## Troubleshooting

### Common Issues

| Problem               | Cause                | Solution                                   |
| --------------------- | -------------------- | ------------------------------------------ |
| "Invalid API key"     | Wrong or missing key | Check `.env` file, verify key in dashboard |
| "Model not found"     | Typo in model name   | Use exact names from docs                  |
| "Rate limited"        | Too many requests    | Add delays, use webhooks for batches       |
| "Timeout"             | Long generation      | Use webhooks for async processing          |
| "Low quality output"  | Vague prompt         | Add more detail, style keywords            |
| "Inconsistent scenes" | Missing style guide  | Use same style keywords in every prompt    |

### Debugging Tips

1. **Check execution status:**

```typescript
const status = await getExecutionStatus(execution.id);
console.log(JSON.stringify(status, null, 2));
```

2. **Log the full execution:**

```typescript
console.log("Full execution:", execution);
```

3. **Test with minimal pipeline:**

```typescript
// Start simple, then add complexity
const test = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "Simple test: a red ball bouncing",
  }),
).execute();
```

---

## Next Steps

You've learned the fundamentals! Here's where to go next:

- **[AI Video Generation Best Practices](/guides/ai-video-generation-best-practices)** - Optimize quality, speed, and cost
- **[Best AI Video Generation Models Compared](/guides/best-ai-video-generation-models)** - Choose the right model for your use case
- **[Multi-Scene AI Video Creation](/guides/multi-scene-ai-video-creation)** - Advanced scene orchestration
- **[AI Video Captions and Subtitles](/guides/ai-video-captions-subtitles)** - Deep dive into caption options

---

## Quick Reference

### Models Cheat Sheet

```typescript
// Video models
videoModel("bytedance/seedance-1-pro", "replicate"); // Best quality
videoModel("minimax/video-01", "replicate"); // Faster
videoModel("veed/fabric-1.0", "fal"); // Lip-sync
videoModel("veed/fabric-1.0/fast", "fal"); // Fast lip-sync

// Image models
imageModel("google/nano-banana", "fal"); // Fast
imageModel("google/nano-banana-pro", "fal"); // High quality

// Audio models
audioModel("elevenlabs/turbo-v2.5", "elevenlabs"); // TTS
audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"); // Transcription
```

### Common Voice IDs

```typescript
"EXAVITQu4vr4xnSDxMaL"; // Sarah (friendly female)
"21m00Tcm4TlvDq8ikWAM"; // Rachel (professional female)
"pNInz6obpgDQGcFmaJgB"; // Adam (authoritative male)
"TxGEqnHWrfWFTfGW9XjX"; // Josh (casual male)
```

### Aspect Ratios

```typescript
"16:9"; // YouTube, desktop
"9:16"; // TikTok, Reels, Shorts
"1:1"; // Instagram feed
"4:5"; // Instagram portrait
"4:3"; // Traditional video
```

---

## Get Help

- **Documentation:** [docs.synthome.dev](https://docs.synthome.dev)
- **Discord:** Join the Synthome community
- **GitHub:** Report issues and request features
- **Email:** support@synthome.dev

[PLACEHOLDER: Support Links]

```
Need:
- Actual documentation URL
- Discord invite link
- GitHub repository URL
- Support email or contact form
```
