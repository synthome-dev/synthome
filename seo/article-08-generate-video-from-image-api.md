# How to Generate Video From a Single Image Using TypeScript

Animating static images into video clips is one of the most practical AI capabilities—product photos become demo videos, illustrations turn into animations, and static content gets new life. This guide shows you how to generate videos from images using TypeScript, from raw API calls to automated pipelines.

---

## Why Generate Video From Images?

Image-to-video (I2V) models animate static images with realistic motion:

**Use cases:**
- **Product demos**: Animate product photos for ads
- **Social media**: Turn photos into eye-catching video posts
- **Presentations**: Bring static slides to life
- **Storytelling**: Animate illustrations for videos
- **Thumbnails**: Create video previews from single frames

**Benefits over text-to-video:**
- More control over composition
- Consistent with your brand imagery
- Faster generation (5-30 seconds vs 60-120 seconds)
- Better quality for specific subjects

## How Image-to-Video Models Work

I2V models analyze a static image and generate plausible motion:

**Input:** `image.jpg` (a mountain landscape)  
**Output:** `video.mp4` (camera pans across the mountains, clouds move)

The model doesn't just interpolate frames—it predicts realistic motion based on the scene content:
- Landscapes: Camera movements, wind effects
- People: Subtle movements, facial expressions
- Objects: Rotation, perspective shifts
- Water/Fire: Natural fluid dynamics

##Available Image-to-Video Models

### 1. Stability AI - Stable Video Diffusion

**Provider:** Replicate, Fal  
**Best for:** High-quality, controlled animations  
**Duration:** 2-4 seconds  
**Cost:** ~$0.02-0.05 per video

```typescript
model: "stability-ai/stable-video-diffusion"
```

### 2. ByteDance - Seedance / AnimateDiff

**Provider:** Replicate  
**Best for:** Cinematic effects, smooth motion  
**Duration:** 2-8 seconds  
**Cost:** ~$0.01-0.03 per video

```typescript
model: "lucataco/animate-diff"
```

### 3. Luma AI - Dream Machine

**Provider:** Luma (direct API)  
**Best for:** Photorealistic motion, longer clips  
**Duration:** 5 seconds  
**Cost:** ~$0.10 per video

```typescript
model: "luma/dream-machine"
```

## Manual Implementation: Replicate API

Let's start by calling Replicate's API directly to understand the mechanics:

```typescript
interface VideoGenerationRequest {
  image: string;      // URL or base64
  duration?: number;  // Seconds
  fps?: number;       // Frames per second
  seed?: number;      // For reproducibility
}

async function generateVideoFromImage(
  params: VideoGenerationRequest
): Promise<string> {
  // Step 1: Submit the generation job
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "de2124e2c7e6c4e9e4e6f3e7a6b0f9e8d7c6b5a4",
      input: {
        image: params.image,
        motion_bucket_id: 127,  // Motion intensity (1-255)
        fps: params.fps || 7,
        cond_aug: 0.02,         // Conditioning augmentation
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to start video generation: ${response.statusText}`);
  }
  
  const prediction = await response.json();
  
  // Step 2: Poll for completion
  let videoUrl: string | null = null;
  
  while (!videoUrl) {
    // Wait 3 seconds before checking
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );
    
    const status = await statusResponse.json();
    
    console.log(`Status: ${status.status}`);
    
    if (status.status === "succeeded") {
      videoUrl = status.output;
    } else if (status.status === "failed") {
      throw new Error(`Video generation failed: ${status.error}`);
    }
  }
  
  return videoUrl;
}

// Usage
const videoUrl = await generateVideoFromImage({
  image: "https://example.com/mountain.jpg",
  duration: 4,
  fps: 7,
});

console.log("Video generated:", videoUrl);
```

**Typical generation time:** 20-40 seconds

## Adding Motion Control

Control how the image animates:

```typescript
interface MotionParams {
  intensity: number;      // 1-255 (higher = more motion)
  cameraMovement?: "pan" | "zoom" | "static" | "auto";
  preserveSubject?: boolean;
}

async function generateVideoWithMotion(
  imageUrl: string,
  motion: MotionParams
): Promise<string> {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "model-version-id",
      input: {
        image: imageUrl,
        motion_bucket_id: motion.intensity,
        // Higher = more motion, lower = subtle animation
      },
    }),
  });
  
  // ... polling logic
}

// Generate with subtle motion
const subtleVideo = await generateVideoWithMotion(
  "https://example.com/portrait.jpg",
  { intensity: 50, cameraMovement: "static" }
);

// Generate with dramatic motion
const dramaticVideo = await generateVideoWithMotion(
  "https://example.com/landscape.jpg",
  { intensity: 200, cameraMovement: "pan" }
);
```

## Handling Different Image Sources

### From URL

```typescript
const videoUrl = await generateVideoFromImage({
  image: "https://example.com/image.jpg",
});
```

### From File Upload

```typescript
// Step 1: Upload image to CDN
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch("https://your-cdn.com/upload", {
    method: "POST",
    body: formData,
  });
  
  const { url } = await response.json();
  return url;
}

// Step 2: Generate video
const imageUrl = await uploadImage(userFile);
const videoUrl = await generateVideoFromImage({ image: imageUrl });
```

### From Base64

```typescript
// Convert base64 to data URL
const base64Image = "iVBORw0KGgoAAAANSUhEUgAA...";
const dataUrl = `data:image/png;base64,${base64Image}`;

const videoUrl = await generateVideoFromImage({
  image: dataUrl,
});
```

## Building a Complete Pipeline

Let's build a full pipeline: Generate image → Animate to video

```typescript
import fetch from "node-fetch";

interface ImageToVideoPipeline {
  imageUrl: string;
  videoUrl: string;
  duration: number;
}

async function createAnimatedVideo(
  textPrompt: string,
  motionIntensity: number = 127
): Promise<ImageToVideoPipeline> {
  console.log("Step 1: Generating image...");
  
  // Generate image with Fal
  const imageResponse = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Authorization": `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: textPrompt,
      image_size: "landscape_16_9",
    }),
  });
  
  const imageData = await imageResponse.json();
  const imageUrl = imageData.images[0].url;
  console.log("Image complete:", imageUrl);
  
  console.log("Step 2: Animating image to video...");
  
  // Animate with Replicate
  const videoUrl = await generateVideoFromImage({
    image: imageUrl,
    duration: 4,
  });
  
  console.log("Video complete:", videoUrl);
  
  return {
    imageUrl,
    videoUrl,
    duration: 4,
  };
}

// Usage
const result = await createAnimatedVideo(
  "A serene mountain landscape at sunrise, cinematic lighting"
);

console.log("Pipeline complete!");
console.log("Image:", result.imageUrl);
console.log("Video:", result.videoUrl);
```

**Total time:** ~30-50 seconds (10s image + 20-40s video)

## Using an SDK for Simplification

The manual approach works but involves repetitive polling logic. Here's the same pipeline with an SDK:

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  imageModel,
  videoModel,
} from "@synthome/sdk";

async function createAnimatedVideoSimple(prompt: string) {
  const execution = await compose(
    generateVideo({
      image: generateImage({
        model: imageModel("fal-ai/flux/schnell", "fal"),
        prompt,
        imageSize: "landscape_16_9",
      }),
      model: videoModel("lucataco/animate-diff", "replicate"),
      duration: 4,
    })
  ).execute();
  
  return execution.result?.url;
}

// Usage
const videoUrl = await createAnimatedVideoSimple(
  "A serene mountain landscape at sunrise"
);

console.log("Video:", videoUrl);
```

**Benefits:**
- No polling logic
- Automatic orchestration (image → video)
- Built-in retry handling
- Progress tracking

## Advanced: Batch Processing

Generate multiple videos from multiple images:

```typescript
async function generateVideosBatch(
  imageUrls: string[]
): Promise<string[]> {
  // Generate all videos in parallel
  const videoPromises = imageUrls.map(imageUrl =>
    generateVideoFromImage({ image: imageUrl })
  );
  
  const videos = await Promise.all(videoPromises);
  
  return videos;
}

// Usage
const videos = await generateVideosBatch([
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg",
]);

console.log("Generated", videos.length, "videos");
```

**Execution time:** Parallel (same as single video, not 3x)

## Optimizing for Quality

### 1. Image Resolution

Higher resolution images produce better videos:

```typescript
// ❌ Low quality
const image = await generateImage({
  prompt: "A sunset",
  width: 512,
  height: 512,
});

// ✅ Better quality
const image = await generateImage({
  prompt: "A sunset",
  width: 1024,
  height: 1024,
});
```

### 2. Motion Intensity

Lower motion intensity works better for portraits, higher for landscapes:

```typescript
// Subtle motion for portraits
const portraitVideo = await generateVideoFromImage({
  image: portraitUrl,
  motionIntensity: 30,  // Minimal movement
});

// Dynamic motion for landscapes
const landscapeVideo = await generateVideoFromImage({
  image: landscapeUrl,
  motionIntensity: 180,  // Camera pans, objects move
});
```

### 3. Frame Rate

Higher FPS = smoother motion (but larger file size):

```typescript
// Standard (smaller file)
const video = await generateVideoFromImage({
  image: imageUrl,
  fps: 7,
});

// Smooth (larger file)
const smoothVideo = await generateVideoFromImage({
  image: imageUrl,
  fps: 24,
});
```

## Practical Example: Product Video Generator

Build a product video generator that takes a product photo and creates an animated showcase:

```typescript
interface ProductVideoOptions {
  imageUrl: string;
  productName: string;
  features: string[];
}

async function generateProductVideo(
  options: ProductVideoOptions
): Promise<string> {
  console.log(`Generating product video for: ${options.productName}`);
  
  // Animate the product image
  const videoUrl = await generateVideoFromImage({
    image: options.imageUrl,
    duration: 5,
    motionIntensity: 100,  // Moderate motion
  });
  
  // Optionally add voiceover
  const voiceoverScript = `${options.productName}. ${options.features.join(". ")}.`;
  
  const audioUrl = await generateAudio({
    text: voiceoverScript,
    voice: "professional-male",
  });
  
  // Merge video and audio
  const final = await mergeVideoAudio(videoUrl, audioUrl);
  
  return final;
}

// Usage
const productVideo = await generateProductVideo({
  imageUrl: "https://example.com/product-photo.jpg",
  productName: "Wireless Earbuds Pro",
  features: [
    "Active noise cancellation",
    "30-hour battery life",
    "Premium sound quality",
  ],
});

console.log("Product video ready:", productVideo);
```

## Error Handling

Image-to-video generation can fail for various reasons:

```typescript
async function generateVideoSafe(imageUrl: string): Promise<string | null> {
  try {
    return await generateVideoFromImage({ image: imageUrl });
  } catch (error) {
    if (error.message.includes("Invalid image")) {
      console.error("Image format not supported");
      return null;
    }
    
    if (error.message.includes("Rate limit")) {
      console.error("Rate limit hit, try again later");
      throw error;  // Rethrow to retry
    }
    
    if (error.message.includes("timeout")) {
      console.error("Generation timed out");
      throw error;  // Rethrow to retry
    }
    
    console.error("Unexpected error:", error);
    return null;
  }
}
```

## Cost Considerations

Image-to-video generation costs vary by provider:

**Replicate (Stable Video Diffusion):**
- ~$0.02 per 4-second video
- Pay per second of compute time

**Fal (Fast AnimateDiff):**
- ~$0.05 per video
- Fixed pricing per generation

**Luma AI:**
- ~$0.10 per 5-second video
- Premium quality

**Cost optimization:**
- Cache results (don't regenerate identical requests)
- Use lower FPS for previews
- Batch process during off-peak hours
- Choose providers based on quality needs

## When to Use Image-to-Video

**Use image-to-video when:**

- You have existing images to animate
- You need consistent visual style (brand imagery)
- You want faster generation than text-to-video
- You need control over composition

**Use text-to-video instead when:**

- You're starting from scratch (no images)
- You need long-form content (30+ seconds)
- Motion is more important than composition control

## Wrapping Up

Generating videos from images using TypeScript is straightforward once you understand the API patterns:

1. Upload or provide image URL
2. Submit to image-to-video API
3. Poll for completion
4. Download result

**Key takeaways:**

- Image-to-video produces higher quality than direct text-to-video
- Motion intensity controls animation style
- Polling is required for most providers
- SDKs simplify orchestration and retry logic
- Batch processing enables parallelization

Start with a single image animation, then build pipelines that generate images and animate them automatically.

---

**Further reading:**

- Learn about video merging for multi-scene content
- Explore audio integration for complete video production
- Study caption generation for accessibility
