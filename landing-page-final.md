# Synthome

---

## Hero

**Composable AI media pipelines**

One SDK for video, image, and audio generation. Any model. Any provider.

```bash
npm install @synthome/sdk
```

[Get started]

[VISUAL: Abstract flowing lines converging from multiple points into a single stream, then expanding into a rendered video frame. Minimal. Dark. Geometric precision.]

---

## Intro

Synthome is a TypeScript SDK for building AI media pipelines.

Generate video. Add audio. Burn captions. Reframe for any platform.
Compose operations from Replicate, Fal, ElevenLabs, Hume — through one unified interface.

Powering AI video products in production.

---

## Code

```typescript
import {
  compose,
  generateVideo,
  addSubtitles,
  reframe,
  replicate,
} from "@synthome/sdk";

await compose(
  generateVideo({
    model: replicate("minimax/video-01-live"),
    prompt: "Mountain landscape at golden hour",
  }),
  reframe({ aspectRatio: "9:16" }),
  addSubtitles(),
).execute();
```

Three operations. One pipeline. No orchestration code.

---

## Built for composition

Synthome handles the complexity of multi-model workflows so you can focus on what to build, not how to wire it together.

### Provider-agnostic

Switch models by changing one line. Your pipeline keeps working.

[ICON: Modular blocks]

### Composable

Chain operations like functions. Image to video to audio to captions — in one definition.

[ICON: Connected nodes]

### Orchestration included

Async execution. Retries. Webhooks. Storage. Built in.

[ICON: Automated flow]

---

## AI-native pipelines

Define pipelines as JSON. Execute dynamically.

Let agents generate workflows. Expose pipelines to non-technical users. Version control your media logic.

```json
{
  "steps": [
    {
      "type": "generateVideo",
      "model": "minimax/video-01-live",
      "prompt": "Product showcase"
    },
    { "type": "addSubtitles" },
    { "type": "reframe", "aspectRatio": "1:1" }
  ]
}
```

```typescript
import { executeFromPlan } from "@synthome/sdk";

await executeFromPlan(pipelineJson);
```

[VISUAL: JSON flowing into a processing node, emerging as a finished video. Clean diagram with code editor aesthetic.]

---

## One pipeline, every platform

Build once. Reframe for Instagram, LinkedIn, TikTok — without rebuilding.

```typescript
const productDemo = compose(
  generateVideo({
    model: replicate("minimax/video-01-live"),
    prompt: "Hero shot",
  }),
  generateVideo({
    model: replicate("minimax/video-01-live"),
    prompt: "Feature closeup",
  }),
  merge(),
);

const instagram = compose(
  productDemo,
  addSubtitles(),
  reframe({ aspectRatio: "9:16" }),
);
const linkedin = compose(
  productDemo,
  addSubtitles(),
  reframe({ aspectRatio: "1:1" }),
);

await Promise.all([instagram.execute(), linkedin.execute()]);
```

Compose. Extend. Execute in parallel.

---

## Providers

Works with the models you use.

|              |                  |
| ------------ | ---------------- |
| Replicate    | Video & Image    |
| Fal          | Fast inference   |
| ElevenLabs   | Voice synthesis  |
| Hume         | Expressive TTS   |
| Google Cloud | Vertex AI        |
| Minimax      | Video generation |

Bring your own API keys. Synthome orchestrates.

[VISUAL: Clean grid of provider logos, monochrome, subtle cards]

---

## Production ready

|         |                   |
| ------- | ----------------- |
| 50,000+ | Videos processed  |
| 25+     | Models integrated |
| 150+    | Daily actions     |

Built on infrastructure that's processed thousands of hours of AI-generated content.

---

## Why Synthome

### Ship faster

Swap models with one line. No integration rewrites.

### Break less

Provider APIs change. Your pipeline doesn't.

### Own nothing

No queues. No job state. No file storage. We handle it.

---

## Pricing

### Free

2,000 actions/month
All providers
Webhooks

[Get started]

### Pay as you go

$50 per 10,000 actions
Priority support
Custom integrations

[View pricing]

### Enterprise

Volume pricing
SLA guarantees
Dedicated support

[Contact]

---

An action is any operation: generate, reframe, merge, subtitle.
You bring provider keys. Synthome charges for orchestration only.

---

## Start building

```bash
npm install @synthome/sdk
```

[Documentation] [GitHub]

---

## Footer

**Product**
Documentation
API Reference
Examples
Changelog
Status

**Providers**
Replicate
Fal
ElevenLabs
Hume
Google Cloud

**Developers**
GitHub
npm
Discord

**Company**
About
Blog
Pricing
Contact

© 2025 Synthome

---

## Meta

**Description**
TypeScript SDK for composable AI media pipelines. Video, image, audio generation through one unified API.

**Social**
Composable AI media pipelines. One SDK for video, image, and audio — any model, any provider.
