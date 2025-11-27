# Synthome — Grid-1 Template

---

## Nav

- Features
- Integrations
- Pricing
- [Get started]

---

## Hero

**Badge:** TypeScript SDK

**Headline:**
Composable AI media pipelines

**Subheadline:**
One SDK for video, image, and audio generation. Any model. Any provider. No orchestration code.

**CTA Primary:** Get started
**CTA Secondary:** Documentation

**Visual:** [Abstract geometric composition — flowing lines representing data pipelines converging and branching. Dark, minimal, precise.]

---

## Logo Cloud

**Label:** Powering AI media in production

Logos: [Customer logos or provider logos as social proof]

---

## Features Grid (3 cards)

### Card 1

**Icon:** Modular blocks
**Title:** Provider-agnostic
**Description:** Replicate, Fal, ElevenLabs, Hume, Google Cloud. Switch models by changing one line. Pipeline keeps working.

### Card 2

**Icon:** Connected nodes
**Title:** Composable
**Description:** Chain operations like functions. Generate, merge, reframe, add audio, burn captions — one definition.

### Card 3

**Icon:** Gears/Automation
**Title:** Orchestration included
**Description:** Async execution. Retries. Webhooks. Job state. Temporary storage. Built in.

---

## Feature Highlight 1 (with image/code)

**Headline:**
Define. Compose. Execute.

**Description:**
Three operations. One pipeline. No manual polling, no retry logic, no state management.

**Code Block:**

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

**Visual:** [Stylized code editor with syntax highlighting, dark theme. Or abstract pipeline flow diagram.]

---

## Feature Highlight 2 (with image/code)

**Headline:**
AI-native pipelines

**Description:**
Define as JSON. Execute dynamically. Let agents generate workflows. Version control your media logic.

**JSON Block:**

```json
{
  "steps": [
    {
      "type": "generateVideo",
      "model": "minimax/video-01-live",
      "prompt": "Product demo"
    },
    { "type": "addSubtitles" },
    { "type": "reframe", "aspectRatio": "1:1" }
  ]
}
```

**Code Block:**

```typescript
import { executeFromPlan } from "@synthome/sdk";

// From your UI, database, or AI agent
await executeFromPlan(pipelineJson);
```

**Visual:** [JSON structure flowing into processing node, emerging as video. Minimal diagram.]

---

## Integrations

**Headline:**
Your models. One interface.

**Grid:**

| Provider     | Type             |
| ------------ | ---------------- |
| Replicate    | Video & Image    |
| Fal          | Fast inference   |
| ElevenLabs   | Voice synthesis  |
| Hume         | Expressive TTS   |
| Google Cloud | Vertex AI        |
| Minimax      | Video generation |

**Subtext:** Bring your own API keys. Synthome orchestrates.

---

## Stats

| Metric            | Value   |
| ----------------- | ------- |
| Videos processed  | 50,000+ |
| Models integrated | 25+     |
| Daily actions     | 150+    |

Built on infrastructure processing thousands of hours of AI-generated content.

---

## Testimonials (2-3 cards)

### Testimonial 1

**Quote:** "Synthome replaced our entire orchestration layer. We just define what we want."
**Author:** Engineering Lead
**Company:** AI Video Platform

### Testimonial 2

**Quote:** "Model swaps used to take days. Now it's one line."
**Author:** Tech Lead
**Company:** Content Startup

### Testimonial 3

**Quote:** "The composable approach changed how we think about AI media pipelines."
**Author:** Founder
**Company:** Video AI Company

---

## FAQs

### What is an action?

Any pipeline operation: generate video, generate image, reframe, merge, add subtitles, lip sync. Most pipelines use 3-5 actions.

### Do I need to set up infrastructure?

No. Async execution, retries, webhooks, and storage are built in.

### Can I use my own API keys?

Yes. Bring your provider keys. Synthome only charges for orchestration.

### Which providers are supported?

Replicate, Fal, ElevenLabs, Hume, Google Cloud (Vertex AI), Minimax. More coming.

### Is there a free tier?

Yes. 2,000 actions per month. All providers. Webhooks included.

### How do I start?

`npm install @synthome/sdk` — TypeScript support, comprehensive documentation.

---

## CTA Section

**Headline:**
Start building

**Subheadline:**
Composable AI media pipelines. First video in minutes.

```bash
npm install @synthome/sdk
```

**CTA Primary:** Get started
**CTA Secondary:** Documentation

---

## Footer

**Product**

- Documentation
- API Reference
- Examples
- Changelog
- Status

**Providers**

- Replicate
- Fal
- ElevenLabs
- Hume
- Google Cloud

**Developers**

- GitHub
- npm
- Discord

**Company**

- About
- Blog
- Pricing
- Contact

© 2025 Synthome
