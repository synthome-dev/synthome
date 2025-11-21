import type { ImageOperation, VideoOperation } from "../core/video.js";

export interface MergeOptions {
  transition?: "crossfade" | "cut" | "dissolve";
}

export function merge(options?: MergeOptions): VideoOperation {
  return {
    type: "merge",
    params: {
      transition: options?.transition || "cut",
    },
  };
}

export interface ReframeOptions {
  aspectRatio: "16:9" | "9:16" | "4:3" | "3:4" | "1:1" | "21:9" | "9:21";
}

export function reframe(options: ReframeOptions): VideoOperation {
  return {
    type: "reframe",
    params: {
      aspectRatio: options.aspectRatio,
    },
  };
}

export interface LipSyncOptions {
  audioUrl: string;
}

export function lipSync(options: LipSyncOptions): VideoOperation {
  return {
    type: "lipSync",
    params: {
      audioUrl: options.audioUrl,
    },
  };
}

export interface SubtitlesOptions {
  language?: string;
  style?: "default" | "minimal" | "bold";
}

export function addSubtitles(options?: SubtitlesOptions): VideoOperation {
  return {
    type: "addSubtitles",
    params: {
      language: options?.language || "en",
      style: options?.style || "default",
    },
  };
}

export interface RemoveBackgroundOptions {
  outputType?: "green-screen" | "alpha-mask" | "foreground-mask";
}

export function removeBackground(
  options?: RemoveBackgroundOptions,
): VideoOperation {
  return {
    type: "removeBackground",
    params: {
      outputType: options?.outputType || "green-screen",
    },
  };
}

/**
 * Predefined placement presets for layering media
 *
 * Simple presets:
 * - "full": Full screen (default)
 * - "center": Centered, original size
 * - "pip" or "picture-in-picture": Small overlay in bottom-right corner
 *
 * Tailwind-style placement strings:
 * - Size: "w-1/2", "w-1/3", "w-1/4", "w-2/3", "w-3/4", "h-1/2", etc.
 * - Position: "top-left", "top-right", "bottom-left", "bottom-right", "center", "top", "bottom", "left", "right"
 * - Combined: "w-1/4 h-1/4 bottom-right", "w-1/2 center", "h-1/3 top"
 *
 * Examples:
 * - "w-1/4 bottom-right" - 1/4 width (aspect preserved), positioned bottom-right
 * - "w-1/2 h-1/2 top-left" - 1/2 width and height, positioned top-left
 * - "h-1/3 center" - 1/3 height (aspect preserved), centered
 */
export type PlacementPreset =
  | "full" // Full screen (default)
  | "center" // Centered, original size
  | "pip" // Alias for picture-in-picture
  | "picture-in-picture" // Small overlay in bottom-right corner
  | string; // Tailwind-style placement string

export interface CustomPlacement {
  width?: string; // e.g., "50%", "1920", "iw/2"
  height?: string; // e.g., "50%", "1080", "ih/2"
  position?: {
    x?: string; // e.g., "0", "50%", "(W-w)/2"
    y?: string; // e.g., "0", "50%", "(H-h)/2"
  };
  padding?: number; // Padding in pixels
  aspectRatio?: string; // e.g., "16:9", "9:16"
}

export interface LayerItem {
  media?:
    | string
    | string[]
    | VideoOperation
    | ImageOperation
    | Array<VideoOperation | ImageOperation>;
  placement?: PlacementPreset | CustomPlacement;
  chromaKey?: boolean;
  chromaKeyColor?: string;
  similarity?: number;
  blend?: number;
  duration?: number; // Optional: Duration for this specific item (used in timeline arrays)
  main?: boolean; // Optional: Marks this layer as the main duration reference
}

// Timeline item for sequential playback (duration now optional for auto-fill)
export interface TimelineItem extends LayerItem {
  duration?: number; // Optional: If not provided, will auto-fill remaining time
}

export interface LayersOptions {
  duration?: number; // Explicit output duration (overrides main layer)
  width?: number;
  height?: number;
  mainLayer?: number; // Alternative way to specify main layer by index
}

export function layers(
  items: Array<LayerItem | TimelineItem[]>,
  options?: LayersOptions,
): VideoOperation {
  // Process items to detect timeline arrays and calculate durations
  const processedLayers = items.map((item, index) => {
    // Check if this is a timeline array
    if (Array.isArray(item)) {
      // Check if any timeline items lack duration (need auto-fill)
      const hasAutoDuration = item.some(
        (timelineItem) =>
          !timelineItem || typeof timelineItem.duration !== "number",
      );

      // Calculate explicit duration total (sum of items that have duration)
      const explicitDuration = item.reduce(
        (sum: number, timelineItem: TimelineItem) =>
          sum + (timelineItem.duration || 0),
        0,
      );

      // If all items have explicit durations, use total
      // Otherwise, mark as needing auto-calculation
      const totalDuration = hasAutoDuration ? undefined : explicitDuration;

      return {
        isTimeline: true,
        timeline: item,
        totalDuration,
        needsAutoDuration: hasAutoDuration,
        explicitDuration, // Partial duration from items with explicit values
      };
    }

    // Regular layer (not a timeline)
    return item;
  });

  // Calculate the maximum duration across timeline layers with explicit durations
  let maxTimelineDuration = 0;
  for (const layer of processedLayers) {
    if (
      typeof layer === "object" &&
      layer !== null &&
      "isTimeline" in layer &&
      "totalDuration" in layer &&
      typeof layer.totalDuration === "number"
    ) {
      maxTimelineDuration = Math.max(maxTimelineDuration, layer.totalDuration);
    }
  }

  // Check if any layer has main flag
  const hasMainLayer = items.some(
    (item) =>
      !Array.isArray(item) && typeof item === "object" && item.main === true,
  );

  // Only use maxTimelineDuration as outputDuration if:
  // 1. No explicit duration provided in options
  // 2. No main layer specified
  // 3. Timeline duration exists
  let calculatedOutputDuration: number | undefined;
  if (
    !options?.duration &&
    !hasMainLayer &&
    !options?.mainLayer &&
    maxTimelineDuration > 0
  ) {
    calculatedOutputDuration = maxTimelineDuration;
  }

  return {
    type: "layer",
    params: {
      layers: processedLayers,
      outputDuration: options?.duration || calculatedOutputDuration,
      outputWidth: options?.width,
      outputHeight: options?.height,
      mainLayer: options?.mainLayer, // Pass through mainLayer option
    },
  };
}
