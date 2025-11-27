# Synthome — Dark Template

---

## Nav

- Features
- Integrations
- Pricing
- [Get started]

---

## Hero

**Headline:**
Composable AI media pipelines

**Subheadline:**
One TypeScript SDK for video, image, and audio. Any model. Any provider.

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

**CTA Primary:** Get started
**CTA Secondary:** Documentation

---

## Logo Cloud

**Label:** Trusted by teams shipping AI video

Logos: [Customer/partner logos]

---

## Features (3 cards)

### Card 1

**Icon:** Blocks
**Title:** Provider-agnostic
**Description:** Replicate, Fal, ElevenLabs, Hume, Google Cloud. Switch models with one line.

### Card 2

**Icon:** Chain
**Title:** Composable
**Description:** Chain operations like functions. Generate, merge, reframe, subtitle — one definition.

### Card 3

**Icon:** Automation
**Title:** Zero infrastructure
**Description:** Async execution, retries, webhooks, storage. All handled.

---

## Large Feature Highlight

**Headline:**
AI-native pipelines

**Subheadline:**
Define as JSON. Execute dynamically. Let agents generate workflows.

**Description:**
Pipelines don't need to be hardcoded. Define them as data, store in databases, generate with AI, expose through no-code interfaces.

**JSON Example:**

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

**Code Example:**

```typescript
import { executeFromPlan } from "@synthome/sdk";

await executeFromPlan(pipelineJson);
```

**Visual:** [Dark code editor aesthetic showing JSON transforming into executed pipeline. Abstract flow visualization.]

---

## Integrations

**Headline:**
Your models. One interface.

**Provider List:**

| Provider     | Capability                |
| ------------ | ------------------------- |
| Replicate    | Video & Image generation  |
| Fal          | Fast AI inference         |
| ElevenLabs   | Voice synthesis           |
| Hume         | Expressive text-to-speech |
| Google Cloud | Vertex AI models          |
| Minimax      | Video generation          |

**Note:** Bring your own API keys. Synthome orchestrates.

---

## Stats

|         |                             |
| ------- | --------------------------- |
| 50,000+ | Videos processed            |
| 25+     | Models integrated           |
| 150+    | Daily actions in production |

---

## Testimonials (2-3 cards)

### Testimonial 1

**Quote:** "Replaced our entire job queue setup. Pipeline code went from 400 lines to 20."
**Author:** Senior Engineer
**Company:** AI Media Platform

### Testimonial 2

**Quote:** "We swap models weekly for A/B tests. With Synthome it's a one-line change."
**Author:** Tech Lead
**Company:** Content Automation Startup

### Testimonial 3

**Quote:** "Finally, an SDK that treats AI media pipelines as first-class citizens."
**Author:** Founder
**Company:** Video AI Company

---

## FAQs

### What's an action?

Any operation in a pipeline: generate video, generate image, reframe, merge, add subtitles, lip sync. Most pipelines are 3-5 actions.

### Do I need infrastructure?

No. Synthome handles async jobs, retries, webhooks, and file storage.

### Can I use my own provider keys?

Yes. You bring API keys for Replicate, Fal, etc. Synthome charges only for orchestration.

### What providers work?

Replicate, Fal, ElevenLabs, Hume, Google Cloud (Vertex AI), Minimax. More added regularly.

### Free tier?

2,000 actions/month. All providers. Webhooks included.

### How do I get started?

`npm install @synthome/sdk` — full TypeScript support, comprehensive docs.

---

## CTA Section

**Headline:**
Start building

**Subheadline:**
Composable AI media pipelines. Minutes to first video.

```bash
npm install @synthome/sdk
```

**CTA Primary:** Get started
**CTA Secondary:** Read the docs

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
