# Synthome Landing Page – Knowledge Brief

## 1. Core Positioning

**Product name:** Synthome
**Type:** TypeScript SDK / developer tool
**What it does:**
A composable API for building **AI media pipelines** (video, image, audio, captions) across multiple model providers, without dealing with model differences, provider quirks, or orchestration complexity.

**Target user:**
Dev teams at startups building AI media / AI video / AI content tools.

**Core promise (concept):**
You plug in whatever models you want; Synthome handles making them work together reliably.

---

## 2. Hero

**Headline (fixed):**
> Build AI video, image, and audio pipelines with a simple composable API

**Subheadline – leading candidates:**

1. **Compose any image, video, and audio models through one unified API, without dealing with model differences or provider quirks.**

2. **Stop fighting inconsistent model inputs and outputs — build reliable multi-model pipelines with one API.**

Use one of these under the hero depending on how aggressive you want the tone.

**Primary CTA:**

- “Get started” or “Read the docs”

**Secondary CTA:**

- `npm install synthome`

---

## 3. Core Product Idea

- Synthome is a **TypeScript SDK** for building **AI media pipelines**.
- Developers can **generate and chain**:
  - images
  - video
  - audio (TTS)
  - captions / subtitles
  from **any model provider** (Fal, Replicate, ElevenLabs, Hume, etc.) via **one unified API**.

- The SDK focuses on:
  - **multi-model composition**
  - **provider-agnostic workflows**
  - **pipeline execution** (async jobs, retries, storage)
  - enabling **AI agents** or UIs to define and trigger pipelines.

---

## 4. Main Pain Points (What Synthome Fixes)

From your Proom / AI video experience:

- Every model behaves differently:
  - different input shapes / parameters
  - different output formats
  - different provider APIs
- Integrating **new models** and swapping/upgrading existing ones **breaks pipelines**.
- Maintaining a large pipeline across **many models (15+ video, 10+ image)** is extremely brittle.
- Companies trying to build this internally often **fail or stall** because:
  - orchestration across models is complex
  - they need to handle async jobs, retries, rate limits, storage, etc.
- The **first pain**: just making *one* model work with your existing pipeline.
  The **ongoing pain**: keeping that system working as models & providers change.

**Simple phrasing of the core pain:**
> “Integrating and updating AI models breaks your video/media pipeline over and over again.”

---

## 5. Core Value Props

### 5.1 For Developers / Teams

- **One unified API** instead of N different provider APIs.
- **Compose multiple models** (image → video → audio → captions) in one pipeline.
- **Swap or add models** without rewriting the whole backend.
- **No need to build orchestration**:
  - async job execution
  - retries
  - pipeline state
  - basic storage handling
- **Simplifies experimentation**:
  - try new models without pipeline surgery
  - A/B test models behind the same pipeline structure

### 5.2 For Startups

- Ship AI media features **faster**.
- Don’t spend your limited engineering budget on model integrations and pipeline plumbing.
- Avoid building yet another internal “media orchestration backend”.

---

## 6. Hello World / First Code Example

**Conceptual hello world:**
> Generate an image → turn it into a video → add captions.

Rough structure (for the page, not exact code):

- Show a pipeline definition where steps might be:
  1. `image.generate`
  2. `video.generate_from_image`
  3. `captions.generate`

The goal of the snippet on the landing page:

- Show **3–4 steps max**
- Show that each step is just a small config object or a function call
- Emphasize how **little code** is needed to wire multiple models together

---

## 7. Key Feature: `executeJSON` / AI-generated Pipelines

This is a unique selling point and deserves its own section.

**What it is:**

- You can **define pipelines as JSON**.
- You can:
  - build JSON manually, or
  - generate it using an **AI agent / LLM** (e.g., “here’s the allowed schema, fill in the steps”).

- Synthome provides a way to **execute that JSON** pipeline:
  - `executeJSON(pipelineJson)` (conceptually)
  - The JSON describes steps like “generate image”, “generate video”, “add audio”, etc.

**What problem it solves:**

- Allows users (or AI agents) to define complex workflows **without writing TypeScript directly**.
- Makes it possible to:
  - let AI **design or modify** pipelines
  - expose pipelines to non-dev UIs
  - store / version pipelines as JSON
- Very powerful for:
  - agentic systems
  - no-code / low-code interfaces on top of Synthome
  - dynamic / user-defined media workflows

**How to present on the page:**

- A separate section like:

  > “Let AI write your pipeline JSON. Synthome runs it.”

- Show:
  - a small JSON pipeline
  - a TypeScript call that executes it

---

## 8. Traction & Proof Points

You can use these as credibility bullets:

- **50,000+ AI videos processed and rendered historically** (from your previous work / Proom backend).
- Pipelines integrated across **15+ video models** and **10+ image models**.
- **1 active customer** using Synthome in production.
- That customer runs **150+ media actions/day** via Synthome.
- Synthome itself was built in **3 weeks** on top of **8 months of prior domain experience** in AI video systems.

These become “Stats” / “Trusted in production” style elements.

---

## 9. Target Audience

- **Primary:** Dev teams at startups building:
  - AI video tools
  - AI media/web apps
  - marketing / generative media products
  - custom AI agents that output media

They are:

- comfortable with TypeScript
- okay with SDKs and code-level integration
- annoyed by dealing with many model providers and brittle pipelines.

---

## 10. Design & Tone

**Tone:**

- Developer-first
- Clear, calm, confident
- Less “marketing hype”, more “this is obviously the right way to do it”
- “Holy shit, this is easy” as emotional target when reading the hero + seeing the code

**Design style:**

- Vercel / Stripe inspired:
  - clean, modern, dark or neutral
  - minimal gradients
  - strong typography
  - prominent code blocks
  - subtle animations at most (no heavy visual noise)

**Homepage order (concept-first):**

1. Hero (headline + subheadline + CTA)
2. Short “why this exists” pain/insight block
3. First code snippet (simple pipeline)
4. High-level “How Synthome works” overview
5. `executeJSON` / AI-generated pipelines spotlight
6. Supported models / providers grid (Fal, Replicate, ElevenLabs, Hume, etc.)
7. Proof / production stats
8. Short “why teams choose Synthome” value cards
9. Pricing preview (2,000 free actions, $50 per 10k, etc.)
10. Footer (Docs, GitHub, npm, etc.)

---

## 11. Messaging Pillars

You can reuse and remix these phrases across the page:

- “One API for all your AI media models.”
- “Stop integrating models. Start composing them.”
- “Models are easy. Pipelines are hard. We fix that.”
- “Build and update multi-model pipelines without breaking your backend.”
- “AI media orchestration, without the infrastructure.”
- “Let AI design your pipelines. Synthome runs them.”

---

## 12. What NOT to Over-Emphasize

For the landing page (vs. the YC app), avoid:

- Deep YC-specific narrative (no pivot story, no Proom backstory in detail).
- Listing too many models in the hero (can move that lower).
- Overly detailed infra descriptions (PgBoss, etc.) in main sections — keep that in docs / tech sections.
- Focusing too much on “rendering logic” if that’s not the main differentiator.

Keep the landing page focused on:

> **Composable, provider-agnostic, multi-model AI media pipelines — no backend pain.**
