# Executing AI Pipelines Defined as JSON (Agent-Friendly Workflow)

AI agents need to build workflows dynamically—no hardcoded pipelines, just JSON schemas they can generate and execute. This guide shows you how to define AI media pipelines as JSON, execute them programmatically, and enable AI agents to orchestrate video generation workflows on the fly.

---

## Why JSON Pipelines?

Hardcoded pipelines are inflexible. JSON pipelines are data:

**Hardcoded:**

```typescript
const result = await compose(
  generateVideo({
    image: generateImage({ prompt: "A sunset" }),
    model: videoModel("animate-diff", "replicate"),
  }),
).execute();
```

**JSON-defined:**

```json
{
  "jobs": [
    {
      "id": "img1",
      "type": "generate-image",
      "params": { "prompt": "A sunset" }
    },
    {
      "id": "vid1",
      "type": "generate-video",
      "params": { "image": "$img1" }
    }
  ]
}
```

**Benefits:**

- **AI agents can generate workflows** (LLMs output JSON)
- **Store workflows in databases** (versioning, reuse)
- **Dynamic execution** (runtime-defined pipelines)
- **Language-agnostic** (any language can parse JSON)

## The Execution Plan Schema

Here's a complete schema for AI media pipelines:

```typescript
interface ExecutionPlan {
  version: string;
  jobs: Job[];
  metadata?: Record<string, any>;
}

interface Job {
  id: string;
  type: JobType;
  params: Record<string, any>;
  dependencies?: string[];
}

type JobType =
  | "generate-image"
  | "generate-video"
  | "generate-audio"
  | "merge"
  | "captions"
  | "resize"
  | "crop";
```

**Example plan:**

```json
{
  "version": "1.0",
  "jobs": [
    {
      "id": "scene1-image",
      "type": "generate-image",
      "params": {
        "prompt": "Mountain landscape at sunrise",
        "model": "fal-ai/flux/schnell"
      }
    },
    {
      "id": "scene1-video",
      "type": "generate-video",
      "params": {
        "image": "$scene1-image",
        "model": "lucataco/animate-diff",
        "duration": 5
      },
      "dependencies": ["scene1-image"]
    },
    {
      "id": "narration",
      "type": "generate-audio",
      "params": {
        "text": "Welcome to the mountains",
        "voice": "professional-male"
      }
    },
    {
      "id": "final",
      "type": "merge",
      "params": {
        "video": "$scene1-video",
        "audio": "$narration"
      },
      "dependencies": ["scene1-video", "narration"]
    }
  ]
}
```

## Building an Execution Engine

Here's how to execute JSON-defined pipelines:

```typescript
class PipelineExecutor {
  private results: Map<string, any> = new Map();

  async execute(plan: ExecutionPlan): Promise<any> {
    console.log(`Executing pipeline with ${plan.jobs.length} jobs`);

    // Validate plan
    this.validatePlan(plan);

    // Execute jobs in dependency order
    const completed = new Set<string>();

    while (completed.size < plan.jobs.length) {
      // Find jobs ready to execute
      const ready = plan.jobs.filter(
        (job) => !completed.has(job.id) && this.dependenciesMet(job, completed),
      );

      if (ready.length === 0) {
        throw new Error("Circular dependency or invalid plan");
      }

      // Execute ready jobs in parallel
      await Promise.all(
        ready.map(async (job) => {
          const result = await this.executeJob(job);
          this.results.set(job.id, result);
          completed.add(job.id);
        }),
      );
    }

    // Return result of last job
    const lastJob = plan.jobs[plan.jobs.length - 1];
    return this.results.get(lastJob.id);
  }

  private dependenciesMet(job: Job, completed: Set<string>): boolean {
    if (!job.dependencies || job.dependencies.length === 0) {
      return true;
    }

    return job.dependencies.every((depId) => completed.has(depId));
  }

  private async executeJob(job: Job): Promise<any> {
    console.log(`Executing job: ${job.id} (${job.type})`);

    // Resolve parameter references ($job-id → actual value)
    const resolvedParams = this.resolveParams(job.params);

    // Execute based on type
    switch (job.type) {
      case "generate-image":
        return this.generateImage(resolvedParams);
      case "generate-video":
        return this.generateVideo(resolvedParams);
      case "generate-audio":
        return this.generateAudio(resolvedParams);
      case "merge":
        return this.merge(resolvedParams);
      case "captions":
        return this.addCaptions(resolvedParams);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private resolveParams(params: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value.startsWith("$")) {
        // Reference to another job's output
        const jobId = value.slice(1);
        resolved[key] = this.results.get(jobId);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private validatePlan(plan: ExecutionPlan): void {
    // Check for circular dependencies
    // Check all referenced jobs exist
    // Validate job parameters
  }

  // Job executors
  private async generateImage(params: any): Promise<string> {
    // Call image generation API
    return "https://cdn.example.com/image.jpg";
  }

  private async generateVideo(params: any): Promise<string> {
    // Call video generation API
    return "https://cdn.example.com/video.mp4";
  }

  private async generateAudio(params: any): Promise<string> {
    // Call audio generation API
    return "https://cdn.example.com/audio.mp3";
  }

  private async merge(params: any): Promise<string> {
    // Merge video and audio
    return "https://cdn.example.com/merged.mp4";
  }

  private async addCaptions(params: any): Promise<string> {
    // Add captions
    return "https://cdn.example.com/final.mp4";
  }
}

// Usage
const executor = new PipelineExecutor();
const result = await executor.execute(plan);
console.log("Final result:", result);
```

## AI Agent Integration

Let an LLM generate execution plans:

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

async function generatePipeline(userRequest: string): Promise<ExecutionPlan> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a video pipeline expert. Generate JSON execution plans for AI video workflows.
        
Available job types:
- generate-image: params { prompt, model }
- generate-video: params { image, model, duration }
- generate-audio: params { text, voice }
- merge: params { video, audio }
- captions: params { video, audio }

Use $job-id syntax to reference outputs.
Return valid JSON matching the ExecutionPlan schema.`,
      },
      {
        role: "user",
        content: userRequest,
      },
    ],
    response_format: { type: "json_object" },
  });

  const plan = JSON.parse(response.choices[0].message.content!);
  return plan as ExecutionPlan;
}

// Usage
const plan = await generatePipeline(
  "Create a 3-scene video about mountain hiking with voiceover narration",
);

const executor = new PipelineExecutor();
const result = await executor.execute(plan);
```

## Using an SDK with JSON Plans

Instead of building an executor, use one that's already built:

```typescript
import { executeFromPlan } from "@synthome/sdk";

const plan = {
  jobs: [
    {
      id: "img1",
      type: "generate-image",
      params: {
        model: "fal-ai/flux/schnell",
        prompt: "Mountain landscape",
      },
    },
    {
      id: "vid1",
      type: "generate-video",
      params: {
        model: "lucataco/animate-diff",
        image: "$img1",
      },
    },
  ],
};

const execution = await executeFromPlan(plan);
console.log("Result:", execution.result?.url);
```

## Advanced Patterns

### Conditional Execution

```json
{
  "jobs": [
    {
      "id": "check-input",
      "type": "validate",
      "params": { "input": "user-data" }
    },
    {
      "id": "process-a",
      "type": "generate-video",
      "params": { "prompt": "Option A" },
      "condition": "$check-input.valid === true"
    },
    {
      "id": "process-b",
      "type": "generate-video",
      "params": { "prompt": "Option B" },
      "condition": "$check-input.valid === false"
    }
  ]
}
```

### Loops and Iteration

```json
{
  "jobs": [
    {
      "id": "generate-scenes",
      "type": "foreach",
      "params": {
        "items": ["Scene 1", "Scene 2", "Scene 3"],
        "job": {
          "type": "generate-video",
          "params": { "prompt": "$item" }
        }
      }
    },
    {
      "id": "merge-all",
      "type": "merge",
      "params": {
        "videos": "$generate-scenes"
      }
    }
  ]
}
```

### Error Handling

```json
{
  "jobs": [
    {
      "id": "generate",
      "type": "generate-video",
      "params": { "prompt": "Main scene" },
      "retry": {
        "max Attempts": 3,
        "backoff": "exponential"
      },
      "fallback": {
        "type": "generate-video",
        "params": { "prompt": "Backup scene", "model": "faster-model" }
      }
    }
  ]
}
```

## Storing Pipelines

Store JSON plans in a database for reuse:

```typescript
// Save pipeline template
await db.pipelines.create({
  name: "product-video",
  plan: {
    jobs: [
      {
        id: "img",
        type: "generate-image",
        params: { prompt: "$product-name" },
      },
      { id: "vid", type: "generate-video", params: { image: "$img" } },
    ],
  },
  variables: ["product-name"],
});

// Later, execute with parameters
const template = await db.pipelines.findOne({ name: "product-video" });
const plan = fillTemplate(template.plan, {
  "product-name": "Wireless Earbuds",
});
const result = await executeFromPlan(plan);
```

## Wrapping Up

JSON-defined AI pipelines enable:

- **AI agents** to generate workflows dynamically
- **Database storage** for versioning and reuse
- **Runtime flexibility** without code changes
- **Language-agnostic** execution

**Key takeaways:**

- JSON pipelines are data, not code
- Dependency resolution enables parallel execution
- Parameter references ($job-id) connect steps
- AI agents can generate valid JSON plans
- SDKs provide production-ready executors

This pattern is essential for AI agents building media workflows programmatically.

---

**Further reading:**

- Learn about validation schemas for execution plans
- Explore conditional execution patterns
- Study pipeline optimization strategies
