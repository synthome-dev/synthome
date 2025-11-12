# Provider API Key Filtering - Technical Overview

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Client Environment                                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Environment Variables                                       │ │
│ │ REPLICATE_API_KEY=r8_xxxxx                                  │ │
│ │ FAL_KEY=fal_xxxxx                                           │ │
│ │ GOOGLE_CLOUD_API_KEY=google_xxxxx                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ SDK: getProviderApiKeysFromEnv()                            │ │
│ │ Returns: { replicate, fal, google-cloud }                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Pipeline.execute()                                          │ │
│ │ 1. Create execution plan: toJSON()                          │ │
│ │    jobs: [                                                  │ │
│ │      { type: "generate", params: { modelId: "minimax/..." }}│ │
│ │    ]                                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔍 NEW: filterProviderApiKeys(plan, apiKeys)                │ │
│ │                                                             │ │
│ │ Step 1: Extract modelIds from plan                         │ │
│ │   → ["minimax/video-01"]                                   │ │
│ │                                                             │ │
│ │ Step 2: Get provider for each model                        │ │
│ │   → getModelInfo("minimax/video-01")                       │ │
│ │   → { provider: "replicate", ... }                         │ │
│ │   → usedProviders = Set(["replicate"])                     │ │
│ │                                                             │ │
│ │ Step 3: Filter API keys                                    │ │
│ │   ✅ usedProviders.has("replicate") → Keep                  │ │
│ │   ❌ usedProviders.has("fal") → Remove                      │ │
│ │   ❌ usedProviders.has("google-cloud") → Remove             │ │
│ │                                                             │ │
│ │ Returns: { replicate: "r8_xxxxx" }                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ HTTP POST to /api/execute                                   │ │
│ │ {                                                           │ │
│ │   jobs: [...],                                              │ │
│ │   providerApiKeys: { replicate: "r8_xxxxx" }  ← FILTERED   │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Backend Server                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ /api/execute endpoint                                       │ │
│ │ - Receives only { replicate: "r8_xxxxx" }                   │ │
│ │ - Stores in database: providerApiKeys column               │ │
│ │ - Creates execution record                                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Job Handler: generate-video.ts                              │ │
│ │ - Fetches execution record from DB                         │ │
│ │ - Gets providerApiKeys: { replicate: "r8_xxxxx" }          │ │
│ │ - Passes to provider factory                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                          ↓                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Provider Factory                                            │ │
│ │ - Uses client's Replicate key: "r8_xxxxx"                  │ │
│ │ - Makes API call to Replicate                              │ │
│ │ - Client pays for usage ✅                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Before vs After Comparison

### Before Optimization

```typescript
// Environment
REPLICATE_API_KEY=r8_xxxxx
FAL_KEY=fal_xxxxx
GOOGLE_CLOUD_API_KEY=google_xxxxx

// Pipeline uses only Replicate
const pipeline = compose(generate({ modelId: "minimax/video-01" }));
await pipeline.execute();

// HTTP Request Payload:
{
  jobs: [...],
  providerApiKeys: {
    replicate: "r8_xxxxx",      // ✅ Used
    fal: "fal_xxxxx",            // ❌ NOT used but sent anyway
    "google-cloud": "google_xxx" // ❌ NOT used but sent anyway
  }
}
```

**Problem**: Unnecessary keys transmitted over network

### After Optimization

```typescript
// Environment (same)
REPLICATE_API_KEY=r8_xxxxx
FAL_KEY=fal_xxxxx
GOOGLE_CLOUD_API_KEY=google_xxxxx

// Pipeline uses only Replicate (same)
const pipeline = compose(generate({ modelId: "minimax/video-01" }));
await pipeline.execute();

// HTTP Request Payload:
{
  jobs: [...],
  providerApiKeys: {
    replicate: "r8_xxxxx"  // ✅ Only the required key is sent
  }
}
```

**Solution**: Only necessary keys transmitted

## Model → Provider Mapping

The SDK uses the model registry to map models to providers:

```typescript
// From @repo/model-schemas/src/registry.ts
export const modelRegistry = {
  "minimax/video-01": {
    provider: "replicate",
    mediaType: "video",
    ...
  },
  "veed/fabric-1.0": {
    provider: "fal",
    mediaType: "video",
    ...
  },
  "bytedance/seedream-4": {
    provider: "replicate",
    mediaType: "image",
    ...
  },
  // ... more models
};

// Usage in filterProviderApiKeys()
const modelInfo = getModelInfo("minimax/video-01");
// Returns: { provider: "replicate", mediaType: "video", ... }
```

## Edge Cases Handled

### 1. No Provider Keys Available

```typescript
// No environment variables set
await pipeline.execute({ apiKey: "sy_xxxxx" });

// Result: Falls back to server's provider keys (backward compatible)
```

### 2. Explicitly Provided Keys

```typescript
// User explicitly provides keys
await pipeline.execute({
  apiKey: "sy_xxxxx",
  providerApiKeys: {
    replicate: "r8_explicit",
    fal: "fal_explicit",
  }
});

// Result: Explicitly provided keys are still filtered based on usage
```

### 3. Unknown Model

```typescript
const pipeline = compose(
  generate({ modelId: "unknown/model-999" })
);

// Result: getModelInfo() returns undefined
// No provider keys are sent (only for recognized models)
```

### 4. Mixed Providers

```typescript
const pipeline = compose(
  generate({ modelId: "minimax/video-01" }),      // Replicate
  generate({ modelId: "veed/fabric-1.0" })        // FAL
);

// Result: Both replicate and fal keys are sent
```

## Performance Characteristics

- **Time Complexity**: O(n) where n = number of jobs in execution plan
  - Typically n < 10 for most pipelines
  - Very fast in practice
  
- **Space Complexity**: O(p) where p = number of unique providers used
  - Maximum p = 3 (replicate, fal, google-cloud)
  - Negligible memory overhead

- **Network Impact**: Reduces payload size by excluding unused keys
  - Average API key length: ~40-50 characters
  - Savings: ~100-200 bytes per unused key (minimal but improves security)

## Code Location

**Implementation**: `/packages/ai-video-sdk/src/compose/pipeline.ts`

```typescript
// Line 157-205: filterProviderApiKeys() method
private filterProviderApiKeys(
  plan: ExecutionPlan,
  apiKeys: { replicate?: string; fal?: string; "google-cloud"?: string }
): { replicate?: string; fal?: string; "google-cloud"?: string } {
  const usedProviders = new Set<VideoProvider>();

  // Extract all modelIds from the execution plan
  for (const job of plan.jobs) {
    if (job.params && typeof job.params === "object" && "modelId" in job.params) {
      const modelId = job.params.modelId;
      if (typeof modelId === "string") {
        const modelInfo = getModelInfo(modelId);
        if (modelInfo) {
          usedProviders.add(modelInfo.provider);
        }
      }
    }
  }

  // Filter API keys to only include keys for used providers
  const filteredKeys: {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
  } = {};

  if (usedProviders.has("replicate") && apiKeys.replicate) {
    filteredKeys.replicate = apiKeys.replicate;
  }
  if (usedProviders.has("fal") && apiKeys.fal) {
    filteredKeys.fal = apiKeys.fal;
  }
  if (usedProviders.has("google-cloud") && apiKeys["google-cloud"]) {
    filteredKeys["google-cloud"] = apiKeys["google-cloud"];
  }

  return filteredKeys;
}
```

```typescript
// Line 367-369: Usage in execute()
if (providerApiKeys && Object.keys(providerApiKeys).length > 0) {
  providerApiKeys = this.filterProviderApiKeys(plan, providerApiKeys);
}
```

## Testing

See `/test-provider-filtering.ts` for example test cases demonstrating the filtering behavior.

---

**Summary**: This optimization automatically filters provider API keys to only send keys for providers actually used in the execution plan, improving security and following the principle of least privilege.
