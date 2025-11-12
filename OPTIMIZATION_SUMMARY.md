# Provider API Key Filtering Optimization

## What Was Implemented

An optimization to the SDK that **only sends provider API keys for providers actually used** in the execution plan.

## Problem Before

When a user had multiple provider API keys in their environment:

```bash
REPLICATE_API_KEY=r8_xxxxx
FAL_KEY=fal_xxxxx
GOOGLE_CLOUD_API_KEY=google_xxxxx
```

And executed a pipeline using **only Replicate models**, the SDK would still send **ALL THREE keys** to the backend, even though only the Replicate key was needed.

## Solution After

The SDK now:

1. **Analyzes the execution plan** to determine which models are being used
2. **Maps each model to its provider** using the model registry
3. **Filters the provider API keys** to only include keys for providers that are actually needed
4. **Sends only the required keys** to the backend

## Example

### Scenario 1: Single Provider

```typescript
// Environment has all three keys
process.env.REPLICATE_API_KEY = "r8_xxxxx";
process.env.FAL_KEY = "fal_xxxxx";
process.env.GOOGLE_CLOUD_API_KEY = "google_xxxxx";

// Pipeline only uses Replicate
const pipeline = compose(
  generate({ modelId: "minimax/video-01", prompt: "sunset" })
);

await pipeline.execute({ apiKey: "sy_xxxxx" });

// ✅ Only Replicate key is sent to backend
// ❌ FAL and Google Cloud keys are NOT sent
```

### Scenario 2: Multiple Providers

```typescript
// Pipeline uses both Replicate and FAL
const pipeline = compose(
  generate({ modelId: "minimax/video-01", prompt: "scene 1" }),
  generate({ modelId: "veed/fabric-1.0", prompt: "scene 2" })
);

await pipeline.execute({ apiKey: "sy_xxxxx" });

// ✅ Both Replicate and FAL keys are sent
// ❌ Google Cloud key is NOT sent
```

## Security Benefits

1. **Reduced attack surface**: Fewer API keys transmitted over the network
2. **Principle of least privilege**: Only send credentials that are actually needed
3. **Better privacy**: Unused provider keys remain private

## Implementation Details

### Files Modified

**`/packages/ai-video-sdk/src/compose/pipeline.ts`**

1. Added import for `getModelInfo` and `VideoProvider` from `@repo/model-schemas`
2. Added `filterProviderApiKeys()` private method to `VideoPipeline` class
3. Modified `execute()` method to filter provider API keys before sending

### Key Code Changes

```typescript
// New method in VideoPipeline class
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
  const filteredKeys = {};
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
// Updated execute() method
async execute(config?: ExecuteOptions): Promise<PipelineExecution> {
  const plan = this.toJSON();
  
  let providerApiKeys = config?.providerApiKeys || getProviderApiKeysFromEnv();
  
  // Only send keys for providers that are actually used in the pipeline
  if (providerApiKeys && Object.keys(providerApiKeys).length > 0) {
    providerApiKeys = this.filterProviderApiKeys(plan, providerApiKeys);
  }
  
  // ... rest of execution logic
}
```

## Backward Compatibility

✅ **Fully backward compatible**

- If you explicitly pass `providerApiKeys`, they are filtered
- If you rely on environment variables, they are read AND filtered
- If you don't provide any keys, falls back to server keys (existing behavior)
- No breaking changes to the API

## Testing

Run the test script to see how filtering works:

```bash
bun run test-provider-filtering.ts
```

Or inspect network requests in your application to verify only required keys are sent.

## Performance Impact

⚡ **Negligible**

- The filtering happens in-memory before sending the HTTP request
- Only iterates through job nodes in the execution plan (typically < 10 jobs)
- Model registry lookups are fast (simple object access)

## Future Improvements

Potential enhancements:

1. **Cache provider detection**: If the same pipeline is executed multiple times, cache which providers are needed
2. **Warning for missing keys**: Warn users if a required provider key is missing
3. **Key validation**: Validate API key format before sending to backend

## Documentation Updates

- Updated `/PROVIDER_API_KEYS.md` to mention the optimization
- Created this summary document

## Summary

This optimization improves security by ensuring only necessary provider API keys are transmitted to the backend, following the principle of least privilege. It's automatic, transparent to users, and fully backward compatible.
