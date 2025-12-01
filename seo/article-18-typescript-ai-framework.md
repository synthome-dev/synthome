# Do You Need a Framework for AI Media Apps? A Developer's Perspective

You're about to build an AI video generation app. You open Google and search "TypeScript AI framework."

You find:

- **LangChain** (17k+ GitHub stars)
- **LlamaIndex** (30k+ GitHub stars)
- **Vercel AI SDK** (15k+ GitHub stars)
- **Replicate SDK** (official, well-documented)
- **OpenAI SDK** (official, simple)

Then you read the docs and realize: **none of these solve your problem.**

LangChain is for LLMs and RAG. LlamaIndex is for data ingestion. Vercel AI SDK is for streaming chat responses. Replicate SDK only works with Replicate.

You need to generate images, create videos, add audio, and stitch it all together. **Where's the framework for that?**

This guide explains the difference between frameworks, SDKs, and raw APIs—and helps you figure out which approach actually fits your use case.

## Framework vs SDK vs Raw API: What's the Difference?

Let's define terms, because the industry uses them loosely.

### Raw API

Direct HTTP calls to a provider's API.

```typescript
const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: { Authorization: `Token ${apiKey}` },
  body: JSON.stringify({
    version: "model-version",
    input: { prompt: "a cat" },
  }),
});
```

**What you get:** Complete control, zero abstraction.

**What you don't get:** Retries, type safety, schema validation, convenience methods.

### SDK (Software Development Kit)

A library that wraps a provider's API with helper functions and types.

```typescript
import Replicate from "replicate";

const replicate = new Replicate({ auth: apiKey });

const prediction = await replicate.predictions.create({
  version: "model-version",
  input: { prompt: "a cat" },
});
```

**What you get:** Type safety, error handling, convenience methods for that specific provider.

**What you don't get:** Multi-provider support, orchestration, workflow logic.

### Framework

A comprehensive toolkit that provides patterns, abstractions, and often opinions about how to structure your entire application.

```typescript
import { LangChain } from "langchain";

const chain = new LangChain()
  .addPrompt("Describe this image")
  .addVisionModel("gpt-4-vision")
  .addOutputParser();

const result = await chain.run({ image });
```

**What you get:** High-level abstractions, built-in patterns, ecosystem of tools.

**What you don't get:** Flexibility (frameworks are opinionated), simplicity (lots of concepts to learn).

## Raw APIs: When Control Matters

### What You Get

- **Complete transparency** - You see exactly what's happening
- **No dependencies** - Just `fetch` and your code
- **Zero learning curve** - If you can read API docs, you're good
- **Maximum flexibility** - Do anything the API supports

### What You Don't Get

- **Type safety** - No compile-time checks
- **Retries** - You implement them yourself
- **Schema validation** - You handle bad responses
- **Rate limiting** - You track and handle limits
- **Convenience** - Every call is verbose

### Example: Raw API Call

```typescript
async function generateImage(prompt: string): Promise<string> {
  // 1. Create prediction
  const createResponse = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: { prompt },
      }),
    },
  );

  if (!createResponse.ok) {
    throw new Error(
      `HTTP ${createResponse.status}: ${await createResponse.text()}`,
    );
  }

  const { id } = await createResponse.json();

  // 2. Poll for result
  let status = "processing";
  let output;

  while (status === "processing" || status === "starting") {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      },
    );

    const result = await pollResponse.json();
    status = result.status;

    if (status === "succeeded") {
      output = result.output;
    } else if (status === "failed") {
      throw new Error(`Prediction failed: ${result.error}`);
    }
  }

  return Array.isArray(output) ? output[0] : output;
}
```

**60 lines** to run one model. This is why SDKs exist.

### When to Use Raw APIs

- You're prototyping and speed matters more than code quality
- You need features the SDK doesn't support
- You're building your own abstraction layer anyway
- The provider doesn't have an SDK

## SDKs: The Pragmatic Choice

SDKs reduce boilerplate while keeping things simple.

### What You Get

- **Type safety** - TypeScript definitions included
- **Simplified API** - Helper methods and sensible defaults
- **Error handling** - Consistent error types
- **Documentation** - Usually better than raw API docs

### Example: Same Task with Replicate SDK

```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateImage(prompt: string): Promise<string> {
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    { input: { prompt } },
  );

  return Array.isArray(output) ? output[0] : output;
}
```

**8 lines** instead of 60. The SDK handles polling, retries, and error normalization.

### The SDK Problem: Provider Lock-In

SDKs are great for single providers. But what if you need multiple?

```typescript
// Replicate SDK
import Replicate from "replicate";
const replicate = new Replicate({ auth: replicateKey });

// Fal SDK
import * as fal from "@fal-ai/serverless-client";
fal.config({ credentials: falKey });

// ElevenLabs SDK
import { ElevenLabsClient } from "elevenlabs";
const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsKey });

// Now you need to learn three different APIs
const image = await replicate.run("stability-ai/sdxl", { input: { prompt } });
const video = await fal.subscribe("fal-ai/fast-svd", { input: { image } });
const audio = await elevenlabs.generate({ text: script });
```

Each SDK has different:

- Method names (`run` vs `subscribe` vs `generate`)
- Response formats
- Error handling patterns
- Async approaches (polling vs streaming)

**You're back to managing complexity yourself.**

### When to Use SDKs

- You're using 1-2 providers max
- The SDK is well-maintained
- You need type safety but not orchestration
- You're okay with provider-specific code

## Frameworks: The Opinionated Approach

Frameworks provide high-level abstractions for common patterns.

### Popular AI Frameworks

**LangChain** (LLM-focused)

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage } from "langchain/schema";

const model = new ChatOpenAI();
const response = await model.call([
  new HumanMessage("What is the capital of France?"),
]);
```

**LlamaIndex** (Data ingestion & RAG)

```typescript
import { VectorStoreIndex, SimpleDirectoryReader } from "llamaindex";

const documents = await new SimpleDirectoryReader().loadData("./data");
const index = await VectorStoreIndex.fromDocuments(documents);
const queryEngine = index.asQueryEngine();
const response = await queryEngine.query("What is RAG?");
```

**Vercel AI SDK** (Streaming chat UIs)

```typescript
import { OpenAIStream, StreamingTextResponse } from "ai";

const response = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
});

return new StreamingTextResponse(OpenAIStream(response));
```

### What Frameworks Provide

- **High-level abstractions** - Think in chains, agents, workflows
- **Ecosystem** - Lots of integrations and plugins
- **Best practices** - Patterns baked in
- **Rapid development** - Less boilerplate

### The Framework Problem: They're Built for LLMs

Notice a pattern? **All popular AI frameworks focus on text models.**

They're great for:

- Chat applications
- RAG (retrieval-augmented generation)
- Document processing
- Text generation

They're **terrible** for:

- Video generation
- Image manipulation
- Audio synthesis
- Multi-modal pipelines

### Why? Different Problem Space

**LLM apps:**

- Single model (usually)
- Streaming responses
- Context management
- Prompt engineering

**Media apps:**

- Multiple models (image → video → audio → merge)
- Async jobs (not streaming)
- State orchestration
- Provider differences

**LangChain can't help you merge a video with audio.** It's solving a different problem.

### When to Use Frameworks

- You're building a chat application
- You need RAG or document QA
- You want an agent architecture
- You're working with text models primarily

## The Media/Multimodal Gap

Here's the reality: **there's no "LangChain for video."**

Why? Because video/image/audio pipelines require:

1. **Multi-provider orchestration** - No single provider has all the models you need
2. **Async job management** - Media models take seconds to minutes
3. **Output normalization** - Every provider returns different schemas
4. **File handling** - Uploading, downloading, transcoding
5. **Cost tracking** - Media is expensive, you need to monitor spend

Existing frameworks don't handle these.

### What Developers Do Instead

**Option 1: DIY orchestration**

```typescript
// Manual coordination
const image = await replicateSDK.run("sdxl", { prompt });
const video = await falSDK.subscribe("fast-svd", { image });
const audio = await elevenLabsSDK.generate({ text: script });
const final = await ffmpeg.mergeVideoAudio(video, audio);
```

**Problem:** You're writing orchestration logic yourself.

**Option 2: Job queues (BullMQ, etc.)**

```typescript
await imageQueue.add("generate", { prompt });
// Worker picks it up, generates image, adds video job
// Video worker picks it up, generates video, adds audio job
// Audio worker picks it up, generates audio, adds merge job
```

**Problem:** Lots of infrastructure and boilerplate.

**Option 3: Pipeline SDK**

This is where specialized tools like **Synthome** come in.

## Pipeline SDKs: A Different Category

Pipeline SDKs focus on **orchestration**, not individual models.

```typescript
import {
  compose,
  generateImage,
  generateVideo,
  generateAudio,
  merge,
  imageModel,
  videoModel,
  audioModel,
} from "@synthome/sdk";

const execution = await compose(
  merge([
    generateVideo({
      model: videoModel("bytedance/seedance-1-pro", "replicate"),
      image: generateImage({
        model: imageModel("google/nano-banana", "fal"),
        prompt: "a cat",
      }),
    }),
    generateAudio({
      model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
      text: "A cat in space",
    }),
  ]),
).execute();

console.log(execution.result?.url);
```

### What Pipeline SDKs Provide

- **Multi-provider support** - Works with Replicate, Fal, ElevenLabs, etc.
- **Orchestration** - Handles dependencies and parallel execution automatically
- **Schema normalization** - Consistent `execution.result` format
- **Error handling** - Retries and fallbacks built-in
- **Progress tracking** - Real-time status updates via webhooks

### Trade-offs

**Pros:**

- Much less code than DIY
- Production-ready orchestration
- Multi-provider from day one
- Automatic parallelization

**Cons:**

- Another service dependency
- Less control than raw APIs
- Learning curve (though smaller than frameworks)

### When to Use Pipeline SDKs

- You're building media/multimodal apps
- You need multiple providers
- You want to ship fast without building orchestration
- You're okay with a service dependency

## Decision Framework

Ask yourself:

### 1. What kind of app are you building?

- **Chat/text AI** → Framework (LangChain, Vercel AI SDK)
- **Media generation** → Pipeline SDK or DIY
- **Simple model calls** → SDK
- **Prototype** → Raw API

### 2. How many providers do you need?

- **One** → Provider SDK
- **Two** → Provider SDKs + light abstraction
- **Three+** → Pipeline SDK or DIY orchestration

### 3. Do you need orchestration?

- **Single model calls** → SDK
- **Sequential pipelines** → Pipeline SDK
- **Complex workflows** → Pipeline SDK or job queue

### 4. What's your team size?

- **Solo** → Use the highest abstraction that fits
- **Small team** → Balance abstractions with control
- **Large team** → Build custom abstractions

### 5. What's your risk tolerance?

- **Low (startup MVP)** → Pipeline SDK (ship fast)
- **Medium (growing product)** → SDK + abstractions
- **High (critical infrastructure)** → DIY with full control

## Practical Example: Same Task, Three Approaches

**Task:** Generate a video with audio narration from a text prompt.

### Approach 1: Raw APIs

```typescript
// ~200 lines of code
// Full control, lots of boilerplate
async function generateVideoWithAudio(prompt: string) {
  const imageUrl = await createReplicateJob("sdxl", { prompt });
  const videoUrl = await createFalJob("fast-svd", { image: imageUrl });
  const audioUrl = await createElevenLabsJob({ text: prompt });
  const finalUrl = await mergeWithFFmpeg(videoUrl, audioUrl);
  return finalUrl;
}
```

**Time to build:** 2-3 days (with retries, error handling, polling)

### Approach 2: Provider SDKs

```typescript
// ~100 lines of code
// Cleaner, still need orchestration logic
import Replicate from "replicate";
import * as fal from "@fal-ai/serverless-client";
import { ElevenLabsClient } from "elevenlabs";

async function generateVideoWithAudio(prompt: string) {
  const replicate = new Replicate({ auth: replicateKey });
  fal.config({ credentials: falKey });
  const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsKey });

  const image = await replicate.run("stability-ai/sdxl", { input: { prompt } });
  const video = await fal.subscribe("fal-ai/fast-svd", { input: { image } });
  const audio = await elevenlabs.generate({ text: prompt });
  const final = await mergeVideoAudio(video.video.url, audio.url);

  return final;
}
```

**Time to build:** 1 day (provider SDKs handle basics, you handle orchestration)

### Approach 3: Pipeline SDK

```typescript
// ~15 lines of code
// Highest abstraction, automatic orchestration
import {
  compose,
  generateImage,
  generateVideo,
  generateAudio,
  merge,
  imageModel,
  videoModel,
  audioModel,
} from "@synthome/sdk";

async function generateVideoWithAudio(prompt: string) {
  const execution = await compose(
    merge([
      generateVideo({
        model: videoModel("bytedance/seedance-1-pro", "replicate"),
        image: generateImage({
          model: imageModel("google/nano-banana", "fal"),
          prompt,
        }),
      }),
      generateAudio({
        model: audioModel("elevenlabs/turbo-v2.5", "elevenlabs"),
        text: prompt,
      }),
    ]),
  ).execute();

  return execution.result?.url;
}
```

**Time to build:** 1 hour (pipeline SDK handles everything, automatic parallelization)

## Conclusion

**Do you need a framework for AI media apps?**

**It depends:**

- **For LLM/chat apps** → Yes, use LangChain or Vercel AI SDK
- **For simple model calls** → No, use provider SDKs
- **For multi-model media pipelines** → Not a traditional framework, but consider a pipeline SDK
- **For complex custom workflows** → Build your own abstractions

**The truth:** Most AI frameworks are built for text models. If you're building media pipelines, you're in a different category.

Your options:

1. **Raw APIs** - Full control, lots of code
2. **Provider SDKs** - Less code, limited to one provider
3. **Pipeline SDKs** - Minimal code, handles orchestration
4. **Job queues** - Production-grade, high complexity

**For most teams building media apps:** Start with provider SDKs, add a thin abstraction layer, then move to a pipeline SDK when orchestration complexity grows.

**Want to skip straight to production-ready orchestration?** Check out [Synthome](https://synthome.ai)—it's a pipeline SDK purpose-built for AI media workflows.
