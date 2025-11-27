# Synthome — Grid-2 Template

---

## Nav

- Features
- Integrations
- Pricing
- [Get started]

---

## Hero

**Badge:** For developers

**Headline:**
Composable AI media pipelines

**Subheadline:**
One TypeScript SDK for video, image, and audio generation. Any model. Any provider. No orchestration code.

**CTA Primary:** Get started
**CTA Secondary:** Documentation

**Visual:** [Abstract 3D render of interconnected geometric nodes forming a flow — representing pipeline composition. Dark background, subtle gradients, minimal.]

---

## Logo Cloud

**Label:** Powering AI media products

Logos: [Company logos or "Trusted by teams building AI video products"]

---

## Features Grid (4 cards)

### Card 1

**Icon:** Blocks/Modules
**Title:** Provider-agnostic
**Description:** Switch between Replicate, Fal, ElevenLabs, Hume — by changing one line. Your pipeline keeps working.

### Card 2

**Icon:** Chain/Flow
**Title:** Composable
**Description:** Chain operations like functions. Image to video to audio to captions — in one readable definition.

### Card 3

**Icon:** Automation/Gears
**Title:** Orchestration included
**Description:** Async execution. Retries. Webhooks. Job state. Storage. All built in.

### Card 4

**Icon:** Code/JSON
**Title:** AI-native
**Description:** Define pipelines as JSON. Execute dynamically. Let agents generate workflows autonomously.

---

## Integrations Section

**Headline:**
Works with your stack

**Subheadline:**
Bring your own API keys. Synthome orchestrates across providers.

**Provider Grid:**

| Provider     | Type             |
| ------------ | ---------------- |
| Replicate    | Video & Image    |
| Fal          | Fast inference   |
| ElevenLabs   | Voice synthesis  |
| Hume         | Expressive TTS   |
| Google Cloud | Vertex AI        |
| Minimax      | Video generation |

---

## Feature Highlight (with image)

**Headline:**
One pipeline, every platform

**Description:**
Build once. Reframe for Instagram, LinkedIn, TikTok — without rebuilding your workflow. Compose base pipelines and extend them.

**Code Block:**

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
```

**Visual:** [Code editor screenshot or stylized code block with multiple platform icons (IG, LinkedIn, TikTok) branching from single source]

---

## Testimonial

**Quote:**
"Synthome replaced hundreds of lines of orchestration code. We just define the pipeline and it runs."

**Author:** Engineering Lead
**Company:** AI Video Startup

---

## Stats

| Metric            | Value   |
| ----------------- | ------- |
| Videos processed  | 50,000+ |
| Models integrated | 25+     |
| Daily actions     | 150+    |

---

## FAQs

### What is an action?

Any operation: generate video, generate image, reframe, merge, add subtitles, lip sync. Most pipelines use 3-5 actions.

### Do I need to set up infrastructure?

No. Synthome handles async execution, retries, webhooks, and temporary storage. You just define the pipeline.

### Can I use my own API keys?

Yes. Bring your provider API keys. Synthome only charges for orchestration.

### What providers are supported?

Replicate, Fal, ElevenLabs, Hume, Google Cloud (Vertex AI), and Minimax. More coming.

### Is there a free tier?

Yes. 2,000 actions per month, all providers, webhook support included.

---

## CTA Section

**Headline:**
Start building

**Subheadline:**
Composable AI media pipelines in minutes.

```bash
npm install @synthome/sdk
```

**CTA Primary:** Get started
**CTA Secondary:** View documentation

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
