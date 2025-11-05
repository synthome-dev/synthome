# Adding a New Model to a Provider

This guide explains how to add a new video generation model to the system.

## Overview

Adding a new model involves three main steps:

1. Define the model's parameter schema
2. Create parameter mappings (unified ↔ provider-specific)
3. Register the model in the central registry

## Directory Structure

Models are organized by provider under `packages/model-schemas/src/providers/`:

```
packages/model-schemas/src/
├── providers/
│   ├── replicate/
│   │   ├── seedance/
│   │   │   ├── schema.ts      # Parameter definitions
│   │   │   ├── mapping.ts     # Unified mappings
│   │   │   └── index.ts       # Exports
│   │   ├── minimax/
│   │   └── index.ts
│   ├── fal/
│   └── google-cloud/
├── replicate.ts               # Provider-level aggregation
├── fal.ts
├── google-cloud.ts
└── registry.ts                # Central model registry
```

## Step-by-Step Guide

### 1. Create Model Directory

Create a new directory for your model under the appropriate provider:

```bash
mkdir -p packages/model-schemas/src/providers/replicate/my-model
```

### 2. Define Parameter Schema

Create `schema.ts` with Zod schema for the model's parameters:

```typescript
// packages/model-schemas/src/providers/replicate/my-model/schema.ts
import { z } from "zod";

export const myModelRawOptionsSchema = z.object({
  prompt: z.string(),
  duration: z.number().int().min(1).max(10).optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  seed: z.number().int().optional(),
  // Add all model-specific parameters here
});

export type MyModelRawOptions = z.infer<typeof myModelRawOptionsSchema>;

export const myModels = {
  "owner/my-model": myModelRawOptionsSchema,
} as const;

export type MyModelId = keyof typeof myModels;
```

**Key Points:**

- Use descriptive schema names
- Include all parameters the model API accepts
- Use `.optional()` for optional parameters
- Export both the schema and TypeScript types

### 3. Create Parameter Mappings

Create `mapping.ts` to map between unified and provider-specific parameters:

```typescript
// packages/model-schemas/src/providers/replicate/my-model/mapping.ts
import type { ParameterMapping } from "../../../unified.js";
import type { MyModelRawOptions } from "./schema.js";

export const myModelMapping: ParameterMapping<MyModelRawOptions> = {
  // Convert from unified parameters to provider-specific format
  toProviderOptions: (unified) => ({
    prompt: unified.prompt,
    duration: unified.duration,
    resolution: unified.resolution,
    aspect_ratio: unified.aspectRatio,
    seed: unified.seed,
  }),

  // Convert from provider-specific format to unified parameters
  fromProviderOptions: (provider) => ({
    prompt: provider.prompt,
    duration: provider.duration,
    resolution: provider.resolution,
    aspectRatio: provider.aspect_ratio,
    seed: provider.seed,
  }),
};
```

**Key Points:**

- `toProviderOptions`: Converts unified → provider format
- `fromProviderOptions`: Converts provider → unified format
- Handle naming differences (e.g., `aspectRatio` ↔ `aspect_ratio`)

### 4. Create Index File

Create `index.ts` to export model definitions:

```typescript
// packages/model-schemas/src/providers/replicate/my-model/index.ts
export { myModels, type MyModelId } from "./schema.js";
export { myModelMapping } from "./mapping.js";
```

### 5. Update Provider File

Add your model to the provider's aggregation file:

```typescript
// packages/model-schemas/src/replicate.ts
import { z } from "zod";
import {
  seedanceModels,
  type SeedanceModelId,
  seedanceMapping,
  // ... other imports
} from "./providers/replicate/index.js";
import {
  myModels,
  type MyModelId,
  myModelMapping,
} from "./providers/replicate/my-model/index.js";

export const replicateSchemas = {
  ...seedanceModels,
  ...myModels,
} as const;

export type ReplicateModelId = SeedanceModelId | MyModelId;

export interface ReplicateModels {
  "bytedance/seedance-1-pro": Seedance1ProOptions;
  "owner/my-model": z.infer<(typeof myModels)["owner/my-model"]>;
}

export const replicateMappings = {
  "bytedance/seedance-1-pro": seedanceMapping,
  "owner/my-model": myModelMapping,
} as const;
```

### 6. Register Model in Central Registry

Add your model to the central registry:

```typescript
// packages/model-schemas/src/registry.ts
export const modelRegistry: Record<AllModelIds, ModelRegistryEntry> = {
  "bytedance/seedance-1-pro": {
    provider: "replicate",
    schema: replicateSchemas["bytedance/seedance-1-pro"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateCapabilities,
  },
  "owner/my-model": {
    provider: "replicate",
    schema: replicateSchemas["owner/my-model"],
    webhookParser: parseReplicateWebhook,
    pollingParser: parseReplicatePolling,
    capabilities: replicateCapabilities,
  },
  // ... other models
};
```

**Key Points:**

- Use the provider's existing webhook/polling parsers
- Use the provider's capabilities
- Ensure the model ID matches exactly

## Testing Your Model

### 1. Create Test Execution

```bash
curl -X POST http://localhost:3100/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "executionPlan": {
      "jobs": [
        {
          "id": "test-video",
          "operation": "pipeline:generate",
          "params": {
            "modelId": "owner/my-model",
            "prompt": "A test video",
            "duration": 5
          }
        }
      ]
    }
  }'
```

### 2. Check Execution Status

```bash
curl http://localhost:3100/api/execute/{execution-id}/status
```

## Common Issues

### Schema Validation Errors

**Problem:** "Unknown model: owner/my-model"

**Solution:** Ensure the model is registered in `registry.ts` with the exact ID.

### Type Errors

**Problem:** TypeScript errors about missing model types

**Solution:**

- Ensure all exports are present in index files
- Rebuild the package: `bun run build`
- Check that `AllModelIds` type includes your model

### Parameter Validation Failures

**Problem:** Model parameters are rejected

**Solution:**

- Check Zod schema matches the API documentation
- Verify required vs. optional parameters
- Test with minimal parameters first

## Adding Models to Other Providers

### Fal.ai Models

Follow the same structure under `packages/model-schemas/src/providers/fal/`:

```typescript
// packages/model-schemas/src/fal.ts
import { falModels, type FalModelId } from "./providers/fal/index.js";

export const falSchemas = {
  ...falModels,
} as const;
```

### Google Cloud Models

Follow the same structure under `packages/model-schemas/src/providers/google-cloud/`:

```typescript
// packages/model-schemas/src/google-cloud.ts
import {
  googleCloudModels,
  type GoogleCloudModelId,
} from "./providers/google-cloud/index.js";

export const googleCloudSchemas = {
  ...googleCloudModels,
} as const;
```

## Best Practices

1. **Naming Conventions:**
   - Use provider/model-name format: `replicate/model-name`
   - Use kebab-case for directories: `my-model/`
   - Use camelCase for TypeScript: `myModelMapping`

2. **Parameter Validation:**
   - Be strict with required parameters
   - Use enums for fixed value sets
   - Add min/max constraints where applicable

3. **Documentation:**
   - Add comments for complex parameters
   - Link to provider's API documentation
   - Document any special requirements

4. **Testing:**
   - Test with minimal parameters
   - Test with all optional parameters
   - Test error cases (invalid values)

## Reference Examples

- **Simple model:** `packages/model-schemas/src/providers/replicate/minimax/`
- **Complex model:** `packages/model-schemas/src/providers/replicate/seedance/`

## Related Files

- Model schemas: `packages/model-schemas/src/providers/`
- Central registry: `packages/model-schemas/src/registry.ts`
- Provider services: `packages/providers/src/services/`
- Job handlers: `packages/jobs/src/jobs/pipeline/`
