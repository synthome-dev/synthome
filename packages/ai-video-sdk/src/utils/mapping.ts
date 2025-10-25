import { replicateMappings, type ReplicateModelId } from "@repo/model-schemas";
import type { UnifiedVideoOptions } from "@repo/model-schemas";

export function mapUnifiedToProviderOptions(
  provider: string,
  modelId: string,
  unifiedOptions: UnifiedVideoOptions,
): unknown {
  if (provider === "replicate") {
    const mapping = replicateMappings[modelId as ReplicateModelId];
    if (mapping) {
      return mapping.toProviderOptions(unifiedOptions);
    }
  }

  return unifiedOptions;
}
