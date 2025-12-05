# AI Video Generation with Code: The Complete Guide for 2026

> **TL;DR:** Generate AI videos programmatically with a few lines of code. No video editing software, no web UI—just API calls that turn text prompts or images into videos. This guide shows you how to build video generation into your apps, with real examples and working code.

## What You'll Learn

- How to generate videos from code using AI APIs
- Text-to-video vs image-to-video: when to use each
- Real examples with working code and the videos they produce
- How to integrate video generation into your applications

---

## What is Programmatic AI Video Generation?

Instead of using video editing software or web-based tools, you write code that calls AI models to generate videos. This lets you:

- **Automate video creation** at scale (generate hundreds of videos)
- **Integrate into your apps** (user uploads image → gets video back)
- **Build pipelines** (generate image → animate it → add music → merge scenes)
- **Version control your prompts** like any other code

**The two main approaches:**

| Approach           | You Provide                   | You Get                       | Best For                         |
| ------------------ | ----------------------------- | ----------------------------- | -------------------------------- |
| **Text-to-Video**  | A text description            | Video from scratch            | Creative content, concepts       |
| **Image-to-Video** | An image + motion description | Animated version of the image | Product shots, controlled output |

### How Good Is It Really?

Let's be honest about where AI video is in 2026:

**Works well:**

- Short clips (5-10 seconds)
- Abstract or artistic content
- Music video visuals and creative content
- Product animations
- Human movement and actions (especially with image-to-video)
- Consistent characters (using image-to-video approach)
- B-roll and background footage

**Still challenging:**

- Text and logos in video (solvable with post-processing)
- Long-form content without cuts (use multi-scene merging instead)

**Pro tip:** Many "complex" use cases become simple with image-to-video. Generate or provide the exact image you want, then animate it. This solves most consistency and control problems.

---

## Text-to-Video: Create Videos from Descriptions

Describe a scene, get a video. This is the most flexible approach.

### Example: Street Interview / UGC Style

<!-- tabs:start -->

#### **Preview**

[PLACEHOLDER: VIDEO]

```
Generate this video with Synthome:
- Model: google/veo-3 (or kling/kling-2.0)
- Prompt: "Street interview style, young woman talking to camera on a busy city sidewalk, handheld camera movement, natural daylight, authentic UGC content feel, shallow depth of field with blurred pedestrians in background"
- Duration: 5 seconds
- Aspect ratio: 9:16

Record: Generation time, cost
```

#### **Code**

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("google/veo-3", "google"),
    prompt:
      "Street interview style, young woman talking to camera on a busy city sidewalk, handheld camera movement, natural daylight, authentic UGC content feel, shallow depth of field with blurred pedestrians in background",
    duration: 5,
    aspectRatio: "9:16",
  }),
).execute();
```

<!-- tabs:end -->

**Generation time:** [PLACEHOLDER] seconds | **Cost:** $[PLACEHOLDER]

### Example: Product Animation

<!-- tabs:start -->

#### **Preview**

[PLACEHOLDER: VIDEO]

```
Generate this video with Synthome:
- Model: kling/kling-2.0
- Prompt: "A sleek wireless earbud case slowly rotating on a reflective black surface, soft studio lighting, product commercial style, subtle light reflections"
- Duration: 5 seconds
- Aspect ratio: 1:1

Record: Generation time, cost
```

#### **Code**

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("kling/kling-2.0", "kling"),
    prompt:
      "A sleek wireless earbud case slowly rotating on a reflective black surface, soft studio lighting, product commercial style, subtle light reflections",
    duration: 5,
    aspectRatio: "1:1",
  }),
).execute();
```

<!-- tabs:end -->

**Generation time:** [PLACEHOLDER] seconds | **Cost:** $[PLACEHOLDER]

### What Makes a Good Prompt

The difference between a mediocre and great result often comes down to the prompt.

**Weak prompt:**

```
A dog running
```

**Strong prompt:**

```
A golden retriever running through shallow ocean waves at sunset,
slow motion, water splashing, warm golden light, cinematic depth of field
```

**The formula that works:**

```
[Subject] + [Action] + [Environment] + [Lighting] + [Style/Quality]
```

| Component       | Examples                                                             |
| --------------- | -------------------------------------------------------------------- |
| **Subject**     | "A golden retriever", "A glass of whiskey", "An astronaut"           |
| **Action**      | "running through", "slowly rotating", "floating in"                  |
| **Environment** | "ocean waves at sunset", "reflective black surface", "deep space"    |
| **Lighting**    | "warm golden light", "soft studio lighting", "dramatic rim lighting" |
| **Style**       | "cinematic", "slow motion", "product commercial", "documentary"      |

---

## Image-to-Video: Animate Your Images

Start with an image you control, add motion. This gives you more predictable results than pure text-to-video.

### Example: Animating a Product Photo

<!-- tabs:start -->

#### **Preview**

[PLACEHOLDER: VIDEO]

```
Generate this video with Synthome:
- Model: google/veo-3
- Image: Use a product photo (e.g., a coffee cup, sneaker, or tech product)
- Prompt: "Gentle steam rising, subtle camera push in, soft focus background"
- Duration: 5 seconds

Record: The source image used, generation time, cost
```

#### **Code**

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("google/veo-3", "google"),
    prompt: "Gentle steam rising, subtle camera push in, soft focus background",
    image: "https://your-product-image.jpg",
    duration: 5,
  }),
).execute();
```

<!-- tabs:end -->

**Generation time:** [PLACEHOLDER] seconds | **Cost:** $[PLACEHOLDER]

### Example: AI-Generated Image to Video

You can chain image generation and video generation. First generate the perfect image, then animate it.

<!-- tabs:start -->

#### **Preview**

[PLACEHOLDER: VIDEO]

```
Generate this with Synthome (two-step pipeline):

Step 1 - Generate image:
- Model: google/imagen-3 (or available image model)
- Prompt: "A confident young man in streetwear standing in front of a graffiti wall, portrait photography, urban style"

Step 2 - Animate the image:
- Model: kling/kling-2.0
- Prompt: "Subtle head movement, blinking, slight smile, wind moving hair gently, natural micro-movements"
- Duration: 5 seconds

Record: Generation time for full pipeline, total cost
```

#### **Code**

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("kling/kling-2.0", "kling"),
    prompt:
      "Subtle head movement, blinking, slight smile, wind moving hair gently, natural micro-movements",
    image: generateImage({
      model: imageModel("google/imagen-3", "google"),
      prompt:
        "A confident young man in streetwear standing in front of a graffiti wall, portrait photography, urban style",
    }),
    duration: 5,
  }),
).execute();
```

<!-- tabs:end -->

**Generation time:** [PLACEHOLDER] seconds | **Cost:** $[PLACEHOLDER]

### When to Use Image-to-Video vs Text-to-Video

| Use Image-to-Video When            | Use Text-to-Video When        |
| ---------------------------------- | ----------------------------- |
| You need specific visual control   | You want creative exploration |
| Working with existing brand assets | Generating concepts quickly   |
| Product photography animation      | Abstract or artistic content  |
| Consistency matters                | Variety matters               |

**Our recommendation:** For production content, generate or select an image first, then animate. It's more predictable.

---

## Multi-Scene Videos: Combining Multiple Clips

Real videos need multiple scenes. Here's how to generate several clips and merge them.

### Example: Product Launch Video

<!-- tabs:start -->

#### **Preview**

[PLACEHOLDER: VIDEO]

```
Generate a 3-scene video with Synthome:

Scene 1:
- Model: google/veo-3
- Prompt: "Close-up of hands unboxing a premium tech product, soft lighting, anticipation"
- Duration: 4 seconds

Scene 2:
- Model: google/veo-3
- Prompt: "The product on a minimalist desk, camera slowly orbiting around it, studio lighting"
- Duration: 4 seconds

Scene 3:
- Model: google/veo-3
- Prompt: "Person smiling while using the product, natural daylight, lifestyle photography style"
- Duration: 4 seconds

Merge all three scenes.

Record: Total generation time, cost, any notes on scene consistency
```

#### **Code**

```typescript
const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("google/veo-3", "google"),
      prompt:
        "Close-up of hands unboxing a premium tech product, soft lighting, anticipation",
      duration: 4,
    }),
    generateVideo({
      model: videoModel("google/veo-3", "google"),
      prompt:
        "The product on a minimalist desk, camera slowly orbiting around it, studio lighting",
      duration: 4,
    }),
    generateVideo({
      model: videoModel("google/veo-3", "google"),
      prompt:
        "Person smiling while using the product, natural daylight, lifestyle photography style",
      duration: 4,
    }),
  ]),
).execute();
```

<!-- tabs:end -->

**Generation time:** [PLACEHOLDER] seconds | **Cost:** $[PLACEHOLDER]

> **Note:** Scenes generate in parallel, so a 3-scene video doesn't take 3x longer than a single scene.

### Keeping Scenes Consistent

The biggest challenge with multi-scene videos: scenes can look like they're from different videos.

**Solution: Use a style guide in every prompt.**

```typescript
const style =
  "warm golden hour lighting, cinematic film grain, shallow depth of field";

merge([
  generateVideo({
    prompt: `Scene 1: Office exterior. ${style}`,
    // ...
  }),
  generateVideo({
    prompt: `Scene 2: Team at desks. ${style}`,
    // ...
  }),
  generateVideo({
    prompt: `Scene 3: Product close-up. ${style}`,
    // ...
  }),
]);
```

---

## The Best AI Video Models in 2026

Here are the top AI video models you can use programmatically:

| Model              | Strengths                                         |
| ------------------ | ------------------------------------------------- |
| **Google Veo 3**   | Highest quality, best motion, understands physics |
| **Kling 2.0**      | Excellent quality, good motion consistency        |
| **Runway Gen-3**   | Good quality, established platform                |
| **Seedance 1 Pro** | Strong quality, reliable                          |

Synthome integrates with all of these models through a unified API—same code, swap the model name.

### Our Recommendation

- **For highest quality:** Veo 3 or Kling 2.0
- **For reliable production use:** Seedance 1 Pro
- **For image-to-video:** Any of the above work well, but image-to-video gives you the most control regardless of model

---

## Common Pitfalls and How to Avoid Them

### 1. Vague Prompts

**Problem:** "A video of a city" gives unpredictable results.

**Solution:** Be specific about everything—time of day, weather, camera angle, style.

### 2. Wrong Aspect Ratio

| Platform              | Use        |
| --------------------- | ---------- |
| YouTube, website      | 16:9       |
| TikTok, Reels, Shorts | 9:16       |
| Instagram feed        | 1:1 or 4:5 |

### 3. Expecting Film-Length Content

AI video works best for short clips (5-10 seconds). For longer content, generate multiple scenes and merge them.

### 4. Inconsistent Style Across Scenes

Include the same style keywords in every prompt when creating multi-scene videos.

### 5. Not Using Parallel Generation

Synthome runs independent operations in parallel. A 3-scene video doesn't take 3x longer—scenes generate simultaneously.

---

## Getting Started

### 1. Get Your API Keys

- **Synthome:** [synthome.dev](https://synthome.dev)

### 2. Install the SDK

```bash
npm install @synthome/sdk
```

### 3. Configure API Keys

```bash
export SYNTHOME_API_KEY="your-key"
```

Or configure provider keys in the [Synthome dashboard](https://synthome.dev) for centralized management.

### 4. Generate Your First Video

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("google/veo-3", "google"),
    prompt: "Your prompt here",
    duration: 5,
  }),
).execute();

console.log("Video URL:", execution.result?.url);
```

---

## Next Steps

- **[How to Generate Videos with AI Agents](/guides/how-to-generate-videos-ai-agents)** — Step-by-step tutorial
- **[AI Video Generation Best Practices](/guides/ai-video-generation-best-practices)** — Optimize quality, speed, and cost
- **[Multi-Scene Video Creation](/guides/multi-scene-ai-video-creation)** — Complex video workflows
- **[AI Lip-Sync Video Guide](/guides/ai-lip-sync-video-guide)** — Create talking head videos

---

## FAQ

**How long does generation take?**

Depends on the model and duration. Typically 30-90 seconds for a 5-second video.

**Can I use these videos commercially?**

Yes. Content you generate is yours to use.

**What resolution is supported?**

Up to 1080p for most models. Some models support 4K.

**How do I maintain consistency across scenes?**

Include the same style keywords in every prompt. Or generate images first, then animate them.

**What if generation fails?**

Synthome handles retries automatically. For custom logic, use the `.onError()` callback.

**Which model should I choose?**

Start with Veo 3 for highest quality. Use Kling 2.0 if you need good quality with faster generation. Try different models—each has slightly different strengths.

**Can I generate videos longer than 10 seconds?**

Yes, by generating multiple scenes and merging them. Each scene can be 5-10 seconds, and you can merge as many as you need.

**Does image-to-video work with any image?**

Works best with high-resolution images (1024x1024+). The image should clearly show what you want to animate. Avoid heavily compressed or blurry images.

**Can I control camera movement?**

Yes, include camera directions in your prompt: "slow zoom in", "camera orbiting around", "tracking shot following subject", "static wide shot", etc.

**How do I add audio or music to generated videos?**

Use the `merge()` function to combine your video with audio files. You can also generate voiceovers with text-to-speech and sync them to your video.
