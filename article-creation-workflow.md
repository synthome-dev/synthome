# Article Creation Workflow

## How This Works

1. **I gather information** (competitor research, structure, code examples from Synthome docs)
2. **I create the full article** with placeholders for things only you can provide
3. **You fill in placeholders** (customer stories, video links, specific metrics)
4. **Publish**

---

## Placeholder Format

When I need input from you, I'll use this format:

```
[PLACEHOLDER: Description of what's needed]

Example:
- Customer success story with specific numbers
- Link to generated video example
- Screenshot of Synthome dashboard
- Your opinion/insight on this topic
```

---

## Article Building Process

### Step 1: Research Phase (I do this)

For each article, I will:

1. **Analyze top 3 Google results** for the target keyword
   - What structure do they use?
   - What topics do they cover?
   - What's MISSING that we can add?

2. **Pull code examples** from Synthome docs
   - Real, working code from the SDK
   - Proper imports and setup
   - Multiple use case variations

3. **Gather technical details**
   - Model options and providers
   - API parameters
   - Performance characteristics

### Step 2: Writing Phase (I do this)

I create the full article with:

- Complete structure
- All code examples (tested against docs)
- Tables and comparisons
- FAQ section
- Internal links to other cluster articles

### Step 3: Your Input (You do this)

You fill in placeholders:

- Real customer examples
- Specific metrics/benchmarks
- Video/image links
- Personal insights

### Step 4: Final Review

Quick check for:

- Technical accuracy
- All placeholders filled
- Links working

---

## Code Examples I Can Use

### Video Generation

```typescript
import { compose, generateVideo, videoModel } from "@synthome/sdk";

const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "A serene mountain landscape at sunrise, cinematic",
    duration: 5,
    aspectRatio: "16:9",
  }),
).execute();

console.log("Video URL:", execution.result?.url);
```

### Image Generation

```typescript
import { compose, generateImage, imageModel } from "@synthome/sdk";

const execution = await compose(
  generateImage({
    model: imageModel("google/nano-banana", "fal"),
    prompt: "A futuristic city skyline at night, neon lights",
    aspectRatio: "16:9",
  }),
).execute();

console.log("Image URL:", execution.result?.url);
```

### Audio Generation (ElevenLabs)

```typescript
import { compose, generateAudio, audioModel } from "@synthome/sdk";

const execution = await compose(
  generateAudio({
    model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
    text: "Welcome to Synthome, the composable AI media toolkit.",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah voice
  }),
).execute();

console.log("Audio URL:", execution.result?.url);
```

### Image-to-Video

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "Gentle wind blowing through the trees",
    image: "https://example.com/landscape.jpg",
  }),
).execute();
```

### Generate Image Then Animate

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "The waves gently rolling onto the shore",
    image: generateImage({
      model: imageModel("google/nano-banana", "fal"),
      prompt: "A beautiful sunset beach scene",
    }),
  }),
).execute();
```

### Lip-Sync Video with Generated Audio

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("veed/fabric-1.0", "fal"),
    prompt: "A professional presenter speaking",
    image: "https://example.com/portrait.jpg",
    audio: generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "Hello! Welcome to our product demo.",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    }),
  }),
).execute();
```

### Multi-Scene Video (Merge)

```typescript
import { compose, generateVideo, merge, videoModel } from "@synthome/sdk";

const execution = await compose(
  merge([
    "https://example.com/intro.mp4",
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Scene 1: A rocket launching into space",
    }),
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      prompt: "Scene 2: Earth from orbit",
    }),
  ]),
).execute();

console.log("Merged video:", execution.result?.url);
```

### Auto-Generated Captions

```typescript
import { compose, captions, audioModel } from "@synthome/sdk";

const execution = await compose(
  captions({
    video: "https://example.com/video.mp4",
    model: audioModel("vaibhavs10/incredibly-fast-whisper", "replicate"),
    style: { preset: "tiktok" },
  }),
).execute();
```

### Background Removal

```typescript
const execution = await compose(
  generateImage({
    model: imageModel("codeplugtech/background_remover", "replicate"),
    image: "https://example.com/portrait.jpg",
  }),
).execute();
```

### With Webhooks (Async)

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "An epic cinematic scene",
  }),
).execute({
  webhook: "https://your-server.com/webhook",
  webhookSecret: "your-secret",
});

console.log("Execution ID:", execution.id);
```

### Progress Tracking

```typescript
const execution = await compose(
  generateVideo({
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "A peaceful forest",
  }),
)
  .onProgress((progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Current job: ${progress.currentJob}`);
  })
  .execute();
```

---

## Available Models Reference

### Video Models

| Model                      | Provider  | Features                            |
| -------------------------- | --------- | ----------------------------------- |
| `bytedance/seedance-1-pro` | replicate | Text-to-video, image-to-video       |
| `minimax/video-01`         | replicate | Text-to-video                       |
| `veed/fabric-1.0`          | fal       | Lip-sync, image-to-video with audio |
| `veed/fabric-1.0/fast`     | fal       | Fast lip-sync                       |

### Image Models

| Model                             | Provider       | Features                      |
| --------------------------------- | -------------- | ----------------------------- |
| `google/nano-banana`              | replicate, fal | Text-to-image, image-to-image |
| `google/nano-banana-pro`          | replicate, fal | Advanced, typography support  |
| `bytedance/seedream-4`            | replicate      | High-resolution               |
| `codeplugtech/background_remover` | replicate      | Background removal            |

### Audio Models

| Model                   | Provider              | Features                   |
| ----------------------- | --------------------- | -------------------------- |
| `elevenlabs/turbo-v2.5` | elevenlabs, replicate | Fast TTS, voice selection  |
| `hume/tts`              | hume                  | Emotionally expressive TTS |

### Transcription Models

| Model                                | Provider  | Features                    |
| ------------------------------------ | --------- | --------------------------- |
| `vaibhavs10/incredibly-fast-whisper` | replicate | Word-level timestamps, fast |
| `openai/whisper`                     | replicate | Sentence-level timestamps   |

### ElevenLabs Voice IDs

| Voice  | ID                     | Description               |
| ------ | ---------------------- | ------------------------- |
| Sarah  | `EXAVITQu4vr4xnSDxMaL` | Soft, friendly female     |
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Calm, professional female |
| Adam   | `pNInz6obpgDQGcFmaJgB` | Deep, authoritative male  |
| Josh   | `TxGEqnHWrfWFTfGW9XjX` | Conversational male       |

---

## Placeholder Types You'll Need to Fill

### Type 1: Customer Success Story

```
[PLACEHOLDER: Customer Success Story]
Need:
- Company name (or "Company X" if anonymous)
- What they built
- Specific results (time saved, videos created, cost reduced)
- Quote if available
```

### Type 2: Generated Media Example

```
[PLACEHOLDER: Video Example]
Need:
- Link to a video generated with Synthome
- The prompt used to generate it
- Any relevant settings (model, duration, etc.)
```

### Type 3: Benchmark/Metric

```
[PLACEHOLDER: Performance Benchmark]
Need:
- Generation time for typical video
- Cost per generation
- Any comparison data
```

### Type 4: Screenshot

```
[PLACEHOLDER: Dashboard Screenshot]
Need:
- Screenshot of Synthome dashboard
- Or screenshot of code in action
- Or before/after comparison image
```

### Type 5: Your Insight

```
[PLACEHOLDER: Expert Insight]
Need:
- Your opinion on best approach
- Common mistake you've seen
- Pro tip from experience
```

---

## Ready to Start?

Tell me which article to write first, and I will:

1. Research top competitors for that keyword
2. Build the complete structure
3. Add all code examples from Synthome docs
4. Create the full article with placeholders
5. Give it to you to fill in the placeholders

### Suggested First Articles (Foundation):

1. **Main Pillar**: "Complete Guide to AI Media Generation"
2. **Image Pillar**: "AI Image Generation with Agents: Complete Guide"
3. **Video Pillar**: "AI Video Generation Guide"
4. **Audio Pillar**: "AI Audio Generation Guide: TTS & Voice Synthesis"

Which one should we start with?
