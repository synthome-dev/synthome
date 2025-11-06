import { replicateMappings, falMappings } from "@repo/model-schemas";
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

  if (provider === "fal") {
    const mapping = falMappings[modelId as keyof typeof falMappings];
    if (mapping) {
      return mapping.toProviderOptions(unifiedOptions);
    }
  }

  return unifiedOptions;
}
