# Synthome Landing Page Copy

## Hero Section

**Headline:**
Build AI video, image, and audio pipelines with a simple composable API

**Subheadline:**
Stop fighting inconsistent model inputs and outputs. Compose any image, video, and audio models through one unified API, without dealing with provider quirks.

**Primary CTA:**
[Get started]

**Secondary CTA:**
`npm install @synthome/sdk`

---

## Pain Points

**Headline:**
Integrating and updating AI models breaks your video pipeline over and over again.

**Grid Items:**

1.  **Inconsistent APIs**
    Every model provider has different input shapes, parameter names, and output formats. You write glue code for every single one.

2.  **Brittle Pipelines**
    Swapping a model or adding a new provider often requires rewriting your entire backend logic.

3.  **Orchestration Nightmares**
    Building a reliable system means handling async polling, retries, rate limits, and file storage across 15+ different models.

4.  **The Maintenance Trap**
    Getting one model working is hard. Keeping a multi-model system running as providers change their APIs is a full-time job.

---

## The Solution

**Headline:**
Models are easy. Pipelines are hard. We fix that.

**Subheadline:**
Synthome is a TypeScript SDK that handles the orchestration, so you can focus on the creative workflow.

**Code Example:**

```typescript
import {
  compose,
  generateVideo,
  addSubtitles,
  videoModel,
} from "@synthome/sdk";

// 1. Define your pipeline
const pipeline = compose(
  generateVideo({
    // Use any supported model with a unified interface
    model: videoModel("bytedance/seedance-1-pro", "replicate"),
    prompt: "A skier glides over snow",
    duration: 5,
  }),
  // Chain operations easily
  addSubtitles(),
);

// 2. Execute it
// Synthome handles async polling, retries, and storage automatically
const execution = await pipeline.execute({
  apiKey: process.env.SYNTHOME_API_KEY,
});

console.log("Final Video URL:", execution.result.url);
```

---

## Key Features

**Feature 1: Unified API**
One API for all your AI media models. Whether it's Replicate, Fal, or Google Cloud, the interface stays the same.

**Feature 2: Multi-Model Composition**
Chain multiple models together—Generate Image → Video → Audio → Captions—in a single, readable pipeline.

**Feature 3: Zero Orchestration**
We manage the infrastructure. Async job execution, retries, state management, and storage are built-in.

**Feature 4: Agent-Ready (executeJSON)**
Let AI agents design your pipelines. Synthome pipelines can be serialized to JSON, allowing agents to dynamically generate and execute complex media workflows.

```typescript
// Allow AI agents to define pipelines as JSON
const pipelineJson = await myAgent.designPipeline();
// { steps: [{ type: "generate_video", ... }, { type: "add_audio", ... }] }

// Execute the JSON directly
await executeJSON(pipelineJson).execute();
```

---

## Trusted in Production

**Stats:**

- **50,000+** AI videos processed
- **15+** Video models supported
- **10+** Image models supported
- **150+** Daily media actions by power users

---

## Supported Providers

**Grid:**

- **Video:** Replicate, Fal, Google Cloud, Minimax
- **Audio:** ElevenLabs, Hume, OpenAI
- **Images:** Fal, Replicate, Google

---

## Pricing

**Simple, transparent pricing.**

- **Developer:** 2,000 free actions / month.
- **Pro:** $50 / month for 10,000 actions.
- **Enterprise:** Custom volume and SLAs.

---

## Footer

[Documentation] [GitHub] [npm]
© 2025 Synthome
