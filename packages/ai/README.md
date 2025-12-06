# @synthome/ai

AI SDK tools for Synthome media workflows. Create images, videos, and audio with AI agents.

## Installation

```bash
npm install @synthome/ai @synthome/sdk
```

## Quick Start

```typescript
import { executePlanTool, planSystemPrompt } from "@synthome/ai";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = await generateText({
  model: openai("gpt-4o"),
  system: planSystemPrompt,
  tools: {
    executePlan: executePlanTool({
      apiKey: process.env.SYNTHOME_API_KEY,
    }),
  },
  prompt: "Create a video of a sunset over mountains",
});
```

## Tools

### executePlanTool

Generates and executes media workflows. The AI creates an ExecutionPlan and runs it immediately.

```typescript
import { executePlanTool, planSystemPrompt } from "@synthome/ai";

const tool = executePlanTool({
  apiKey: process.env.SYNTHOME_API_KEY,
  // Optional: webhook for async execution
  webhook: "https://myapp.com/webhook",
  webhookSecret: process.env.WEBHOOK_SECRET,
  // Optional: provider API keys
  providerApiKeys: {
    replicate: process.env.REPLICATE_API_KEY,
    fal: process.env.FAL_KEY,
  },
});
```

### buildPlanTool

Generates workflow plans without executing them. Use this to design workflows for later execution.

```typescript
import { buildPlanTool, planSystemPrompt } from "@synthome/ai";
import { executeFromPlan } from "@synthome/sdk";

const result = await generateText({
  model: openai("gpt-4o"),
  system: planSystemPrompt,
  tools: {
    buildPlan: buildPlanTool(),
  },
  prompt: "Design a workflow for creating a product video",
});

// Save the plan for later
const plan = result.toolResults[0].result.plan;
await db.savePlan("product-video", plan);

// Execute whenever you want
const execution = await executeFromPlan(plan, {
  apiKey: process.env.SYNTHOME_API_KEY,
});
```

## Using Both Tools

Let the AI decide whether to execute immediately or build for later:

```typescript
const result = await generateText({
  model: openai("gpt-4o"),
  system: planSystemPrompt,
  tools: {
    executePlan: executePlanTool({ apiKey: process.env.SYNTHOME_API_KEY }),
    buildPlan: buildPlanTool(),
  },
  prompt: "Create a video now", // AI uses executePlan
  // or
  prompt: "Design a workflow for later", // AI uses buildPlan
});
```

## System Prompt

The `planSystemPrompt` teaches the AI how to generate valid ExecutionPlan JSON. It includes:

- Available operation types (generateImage, generateVideo, merge, etc.)
- Available models and providers
- Examples of single and multi-step workflows
- Job dependency syntax

## Schemas

For advanced use cases, you can access the Zod schemas directly:

```typescript
import { executionPlanSchema, jobNodeSchema } from "@synthome/ai";

// Validate a plan
const result = executionPlanSchema.safeParse(userProvidedPlan);
if (!result.success) {
  console.error(result.error);
}
```

## Supported Operations

| Operation               | Description                       |
| ----------------------- | --------------------------------- |
| `generateImage`         | Generate images from text prompts |
| `generate`              | Generate videos from text/images  |
| `generateAudio`         | Generate speech from text         |
| `merge`                 | Combine multiple media items      |
| `layer`                 | Composite media layers            |
| `removeBackground`      | Remove video backgrounds          |
| `removeImageBackground` | Remove image backgrounds          |
| `reframe`               | Change aspect ratio               |
| `lipSync`               | Sync video with audio             |
| `addSubtitles`          | Add subtitles to video            |

## License

MIT
