# executeFromPlan() - Direct Job Execution

The `executeFromPlan()` function allows you to execute jobs directly from an `ExecutionPlan` JSON object, bypassing the `compose()` builder pattern.

## Why Use This?

1. **Store and reuse workflows** - Save execution plans to a database and execute them later
2. **Dynamic job creation** - Build job arrays programmatically based on user input
3. **API integration** - Accept job definitions from external APIs
4. **Template-based workflows** - Create reusable job templates

## Basic Usage

### Step 1: Get an ExecutionPlan

You can get an `ExecutionPlan` from any pipeline:

```typescript
import { compose, generateImage, replicate } from "@repo/ai-video-sdk";

const pipeline = compose(
  generateImage({
    model: replicate("bytedance/seedream-4"),
    prompt: "A futuristic cityscape",
  }),
);

const plan = pipeline.toJSON();
console.log(plan);
```

**Output:**

```json
{
  "jobs": [
    {
      "id": "job1",
      "type": "generateImage",
      "params": {
        "modelId": "bytedance/seedream-4",
        "provider": "replicate",
        "prompt": "A futuristic cityscape"
      },
      "output": "$job1"
    }
  ]
}
```

### Step 2: Execute the Plan

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

// Execute the plan (blocking mode - waits for completion)
const execution = await executeFromPlan(plan);

console.log(execution.status); // "completed"
console.log(execution.result); // { url: "...", ... }
```

## ExecutionPlan Format

An `ExecutionPlan` has the following structure:

```typescript
interface ExecutionPlan {
  jobs: JobNode[];
  baseExecutionId?: string; // Optional: for execution chaining
}

interface JobNode {
  id: string; // Unique job ID
  type: OperationType; // Job type (e.g., "generateImage", "replaceGreenScreen")
  params: Record<string, any>; // Job parameters
  dependsOn?: string[]; // Optional: array of job IDs this job depends on
  output: string; // Output reference (e.g., "$job1")
}
```

## Examples

### Example 1: Save and Execute Later

```typescript
import {
  compose,
  generateImage,
  replicate,
  executeFromPlan,
} from "@repo/ai-video-sdk";
import { db } from "./database";

// Create and save a workflow template
const pipeline = compose(
  generateImage({
    model: replicate("bytedance/seedream-4"),
    prompt: "A beautiful landscape",
  }),
);

const plan = pipeline.toJSON();
await db.saveWorkflow("landscape-template", plan);

// Later... execute the saved workflow
const savedPlan = await db.getWorkflow("landscape-template");
const execution = await executeFromPlan(savedPlan);
```

### Example 2: Dynamic Job Creation

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

// Build jobs dynamically based on user input
const userPrompts = ["sunset", "mountains", "ocean"];

const plan = {
  jobs: userPrompts.map((prompt, index) => ({
    id: `job${index + 1}`,
    type: "generateImage",
    params: {
      modelId: "bytedance/seedream-4",
      provider: "replicate",
      prompt: `A beautiful ${prompt}`,
    },
    output: `$job${index + 1}`,
  })),
};

const execution = await executeFromPlan(plan);
```

### Example 3: Complex Pipeline with Dependencies

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

const plan = {
  jobs: [
    // Job 1: Generate background image
    {
      id: "generate-bg",
      type: "generateImage",
      params: {
        modelId: "bytedance/seedream-4",
        provider: "replicate",
        prompt: "A futuristic cityscape",
      },
      output: "$generate-bg",
    },
    // Job 2: Replace green screen (depends on job 1)
    {
      id: "final-video",
      type: "replaceGreenScreen",
      params: {
        video: "https://cdn.example.com/greenscreen-video.mp4",
        background: "_imageJobDependency:generate-bg",
        similarity: 0.1,
        blend: 0.15,
      },
      dependsOn: ["generate-bg"],
      output: "$final-video",
    },
  ],
};

const execution = await executeFromPlan(plan);
```

### Example 4: Non-Blocking Execution with Webhook

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

const plan = {
  /* ... */
};

// Execute without waiting (returns immediately)
const execution = await executeFromPlan(plan, {
  webhook: "https://myapp.com/webhook",
  webhookSecret: "my-secret-key",
});

console.log(execution.id); // "exec_xxx"
console.log(execution.status); // "pending"

// Webhook will be called when execution completes
```

### Example 5: Custom API Keys

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

const plan = {
  /* ... */
};

const execution = await executeFromPlan(plan, {
  apiKey: "your-synthome-api-key",
  apiUrl: "https://api.yourdomain.com/api/execute",
  providerApiKeys: {
    replicate: "your-replicate-key",
    fal: "your-fal-key",
  },
});
```

## Execution Options

All the same options from `compose().execute()` are supported:

```typescript
interface ExecuteOptions {
  apiKey?: string; // SYNTHOME_API_KEY for backend auth
  apiUrl?: string; // Custom API endpoint
  baseExecutionId?: string; // Parent execution ID for chaining
  webhook?: string; // Webhook for completion notification
  webhookSecret?: string; // HMAC secret for webhook verification
  providerApiKeys?: {
    // Provider API keys
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  };
}
```

## Operation Types

Supported operation types:

- `generateImage` - Generate an image
- `generateVideo` / `generate` - Generate a video
- `generateAudio` - Generate audio
- `removeBackground` - Remove video background
- `removeImageBackground` - Remove image background
- `replaceGreenScreen` - Replace green screen in video
- `merge` - Merge multiple videos
- `reframe` - Change video aspect ratio
- `lipSync` - Lip-sync video to audio
- `addSubtitles` - Add subtitles to video

## Validation

The function validates the execution plan:

- ✅ Plan must have a `jobs` array
- ✅ Jobs array must not be empty
- ✅ Each job must have `id`, `type`, and `params`
- ❌ Throws an error if validation fails

## Error Handling

```typescript
import { executeFromPlan } from "@repo/ai-video-sdk";

try {
  const execution = await executeFromPlan(invalidPlan);
} catch (error) {
  if (error.message.includes("ExecutionPlan must contain")) {
    console.error("Invalid plan format");
  } else if (error.message.includes("Failed to create execution")) {
    console.error("API error:", error.message);
  } else {
    console.error("Execution failed:", error.message);
  }
}
```

## Testing

Test endpoints are available in the backend:

```bash
# Test round-trip: compose -> toJSON -> executeFromPlan
curl http://localhost:3100/api/test/execute-from-plan

# Test with custom JSON
curl -X POST http://localhost:3100/api/test/execute-from-plan \
  -H "Content-Type: application/json" \
  -d '{
    "plan": {
      "jobs": [
        {
          "id": "job1",
          "type": "generateImage",
          "params": {
            "modelId": "bytedance/seedream-4",
            "provider": "replicate",
            "prompt": "A beautiful sunset"
          },
          "output": "$job1"
        }
      ]
    }
  }'
```

## Comparison: compose() vs executeFromPlan()

### Using compose() (Builder Pattern)

```typescript
const execution = await compose(
  generateImage({
    model: replicate("bytedance/seedream-4"),
    prompt: "A sunset",
  }),
).execute();
```

**Pros:**

- Type-safe
- IDE autocomplete
- Composable operations

**Cons:**

- Can't serialize/store
- Must be defined in code

### Using executeFromPlan() (Direct Execution)

```typescript
const plan = {
  jobs: [
    {
      id: "job1",
      type: "generateImage",
      params: {
        modelId: "bytedance/seedream-4",
        provider: "replicate",
        prompt: "A sunset",
      },
      output: "$job1",
    },
  ],
};

const execution = await executeFromPlan(plan);
```

**Pros:**

- Can serialize/store
- Dynamic job creation
- Load from database/API

**Cons:**

- Less type-safe (plain JSON)
- No autocomplete for params

## Best Practices

1. **Store Templates**: Use `executeFromPlan()` for reusable workflow templates
2. **Validate Plans**: Always validate execution plans before storing them
3. **Use Webhooks**: For long-running jobs, use webhooks instead of blocking
4. **Handle Errors**: Wrap `executeFromPlan()` calls in try-catch blocks
5. **Document Params**: When creating custom plans, document required parameters

## Migration Guide

If you're currently using `compose()`, you can easily migrate:

```typescript
// Before
const execution = await compose(...).execute();

// After - get the plan first
const plan = compose(...).toJSON();
await db.savePlan(plan);  // Store it
const execution = await executeFromPlan(plan);  // Execute later
```
