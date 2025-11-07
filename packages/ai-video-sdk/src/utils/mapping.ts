import { replicateMappings, falMappings } from "@repo/model-schemas";
import type {
  UnifiedVideoOptions,
  VideoGenerationMapping,
} from "@repo/model-schemas";

export function mapUnifiedToProviderOptions(
  provider: string,
  modelId: string,
  unifiedOptions: UnifiedVideoOptions,
): unknown {
  if (provider === "replicate") {
    const mapping =
      replicateMappings[modelId as keyof typeof replicateMappings];
    if (mapping && "toProviderOptions" in mapping) {
      return (mapping as VideoGenerationMapping<any>).toProviderOptions(
        unifiedOptions,
      );
    }
  }

  if (provider === "fal") {
    const mapping = falMappings[modelId as keyof typeof falMappings];
    if (mapping) {
      return (mapping as VideoGenerationMapping<any>).toProviderOptions(
        unifiedOptions,
      );
    }
  }

  return unifiedOptions;
}
