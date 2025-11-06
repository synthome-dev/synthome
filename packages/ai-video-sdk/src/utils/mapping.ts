import { replicateMappings } from "@repo/model-schemas";
import type { UnifiedVideoOptions } from "@repo/model-schemas";

export function mapUnifiedToProviderOptions(
  provider: string,
  modelId: string,
  unifiedOptions: UnifiedVideoOptions,
): unknown {
  if (provider === "replicate") {
    const mapping =
      replicateMappings[modelId as keyof typeof replicateMappings];
    if (mapping) {
      return mapping.toProviderOptions(unifiedOptions);
    }
  }

  return unifiedOptions;
}
