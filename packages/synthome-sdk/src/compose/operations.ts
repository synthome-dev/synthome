import type {
  AudioOperation,
  ImageOperation,
  VideoOperation,
} from "../core/video.js";

// =============================================================================
// Merge Types
// =============================================================================

/** Media type for merge items */
export type MergeMediaType = "video" | "image" | "audio";

/** Any supported operation type */
export type MergeOperation = VideoOperation | ImageOperation | AudioOperation;

/** Merge item with options */
export interface MergeItemWithOptions {
  /** URL string or operation */
  url: string | MergeOperation;
  /** Media type - auto-detected if not provided */
  type?: MergeMediaType;
  /** For video: optional trim duration. For image: display duration (default 1s) */
  duration?: number;
  /** For audio only: start position in timeline in seconds (default: 0) */
  offset?: number;
  /** Volume level from 0 to 1 (default: 1). Works for audio items and video items (affects their audio track) */
  volume?: number;
}

/**
 * Union type for all supported merge item formats:
 * - string: Simple URL (type auto-detected from extension)
 * - MergeOperation: Direct operation (type auto-detected)
 * - MergeItemWithOptions: URL or operation with explicit options
 */
export type MergeItem = string | MergeOperation | MergeItemWithOptions;

/**
 * Merge multiple media items (videos, images, audio) into a single video.
 *
 * @param items - Array of media items to merge
 * @returns VideoOperation for the merge
 *
 * @example
 * // Simple video merge with URLs
 * merge([
 *   "https://example.com/video1.mp4",
 *   "https://example.com/video2.mp4",
 * ])
 *
 * @example
 * // Slideshow from images with custom duration
 * merge([
 *   { url: "https://example.com/img1.jpg", duration: 3 },
 *   { url: "https://example.com/img2.jpg", duration: 2 },
 * ])
 *
 * @example
 * // Mixed media with audio
 * merge([
 *   "https://example.com/intro.mp4",
 *   { url: "https://example.com/title.png", duration: 2 },
 *   "https://example.com/main.mp4",
 *   { url: "https://example.com/music.mp3", offset: 0 },
 * ])
 *
 * @example
 * // With generated content
 * merge([
 *   generateVideo({ model: videoModel("minimax", "replicate"), prompt: "Scene 1" }),
 *   generateVideo({ model: videoModel("minimax", "replicate"), prompt: "Scene 2" }),
 * ])
 *
 * @example
 * // Generated content with options
 * merge([
 *   { url: generateVideo({ ... }), duration: 5 },
 *   { url: generateImage({ ... }), duration: 3 },
 *   { url: generateAudio({ ... }), offset: 2 },
 * ])
 */
export function merge(items: MergeItem[]): VideoOperation {
  // Process items to normalize them for the execution plan
  const processedItems = items.map((item) => processeMergeItem(item));

  return {
    type: "merge",
    params: {
      items: processedItems,
    },
  };
}

/** Detect media type from URL extension */
function detectMediaType(url: string): MergeMediaType {
  const lowerUrl = url.toLowerCase();

  // Audio extensions
  if (
    lowerUrl.endsWith(".mp3") ||
    lowerUrl.endsWith(".wav") ||
    lowerUrl.endsWith(".aac") ||
    lowerUrl.endsWith(".ogg") ||
    lowerUrl.endsWith(".m4a") ||
    lowerUrl.endsWith(".flac")
  ) {
    return "audio";
  }

  // Image extensions
  if (
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".gif") ||
    lowerUrl.endsWith(".webp") ||
    lowerUrl.endsWith(".bmp")
  ) {
    return "image";
  }

  // Default to video
  return "video";
}

/** Check if an object is an operation (has type and params) */
function isOperation(obj: unknown): obj is MergeOperation {
  return (
    typeof obj === "object" && obj !== null && "type" in obj && "params" in obj
  );
}

/** Check if an object is a MergeItemWithOptions (has url property) */
function isMergeItemWithOptions(obj: unknown): obj is MergeItemWithOptions {
  return typeof obj === "object" && obj !== null && "url" in obj;
}

/** Detect media type from an operation */
function detectOperationType(op: MergeOperation): MergeMediaType {
  if (op.type === "generate" || op.type === "removeBackground") {
    return "video";
  }
  if (op.type === "generateImage" || op.type === "removeImageBackground") {
    return "image";
  }
  if (op.type === "generateAudio") {
    return "audio";
  }
  // Default to video for unknown operation types
  return "video";
}

/** Processed merge item for execution plan */
export interface ProcessedMergeItem {
  url?: string;
  type: MergeMediaType;
  duration?: number;
  offset?: number;
  volume?: number;
  // For job dependencies, store the operation
  operation?: MergeOperation;
}

/** Process a merge item into normalized format */
function processeMergeItem(item: MergeItem): ProcessedMergeItem {
  // Simple string URL
  if (typeof item === "string") {
    const type = detectMediaType(item);
    return {
      url: item,
      type,
      duration: type === "image" ? 1 : undefined,
      offset: type === "audio" ? 0 : undefined,
    };
  }

  // Direct operation (no options)
  if (isOperation(item)) {
    const type = detectOperationType(item);
    return {
      type,
      operation: item,
      duration: type === "image" ? 1 : undefined,
      offset: type === "audio" ? 0 : undefined,
    };
  }

  // MergeItemWithOptions (has url property)
  if (isMergeItemWithOptions(item)) {
    const { url, duration, offset, volume } = item;

    // url is a string
    if (typeof url === "string") {
      const type = item.type ?? detectMediaType(url);
      return {
        url,
        type,
        duration: duration ?? (type === "image" ? 1 : undefined),
        offset: offset ?? (type === "audio" ? 0 : undefined),
        volume,
      };
    }

    // url is an operation
    if (isOperation(url)) {
      const type = item.type ?? detectOperationType(url);
      return {
        type,
        operation: url,
        duration: duration ?? (type === "image" ? 1 : undefined),
        offset: offset ?? (type === "audio" ? 0 : undefined),
        volume,
      };
    }
  }

  // Fallback - shouldn't reach here
  throw new Error(`Invalid merge item: ${JSON.stringify(item)}`);
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
  const processedLayers = items.map((item) => {
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
