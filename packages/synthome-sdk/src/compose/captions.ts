import type {
  VideoNode,
  VideoOperation,
  TranscribeOperation,
} from "../core/video.js";
import type { AudioModel } from "../core/types.js";

// Define input types
export interface CaptionWord {
  word: string;
  start: number;
  end: number;
}

export interface CaptionStyle {
  // Preset configuration
  preset?: "tiktok" | "youtube" | "story" | "minimal" | "cinematic";

  // Font properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;

  // Color properties (supports both hex #RRGGBB and ASS &HAABBGGRR formats)
  color?: string; // Text color (e.g., "#FFFFFF" for white)
  outlineColor?: string; // Outline/stroke color around text
  backgroundColor?: string; // Background box color (automatically enables opaque box when set)

  // Border and shadow
  borderStyle?: 1 | 3; // 1=Outline only, 3=Opaque background box
  outlineWidth?: number; // Width of text outline (when borderStyle: 1)
  padding?: number; // Padding around text in background box (when borderStyle: 3, default: 10)
  borderRadius?: number; // Border radius for background box (NOTE: requires custom rendering)
  shadowDistance?: number;

  // Positioning
  alignment?: string; // ASS numpad style: 1-3=bottom, 4-6=middle, 7-9=top (2=bottom-center)
  marginV?: number;
  marginL?: number;
  marginR?: number;

  // Caption behavior
  wordsPerCaption?: number; // How many words to show at once
  maxCaptionDuration?: number; // Max duration in seconds
  maxCaptionChars?: number; // Max characters per caption

  // Word highlighting
  highlightActiveWord?: boolean; // Enable/disable word highlighting
  activeWordColor?: string; // Color for active word (supports hex: #RRGGBB or ASS: &HAABBGGRR)
  inactiveWordColor?: string; // Color for inactive words (supports hex: #RRGGBB or ASS: &HAABBGGRR)
  activeWordScale?: number; // Scale multiplier for active word
  animationStyle?: "none" | "color" | "scale" | "glow"; // Animation type
}

export interface CaptionsOptions {
  video: string | VideoNode; // Can be a URL string or a VideoOperation/Node
  captions?: CaptionWord[];
  model?: AudioModel<any>; // AudioModel for transcription
  style?: CaptionStyle;
}

/**
 * Add captions to a video.
 *
 * @param options Configuration for captions
 * @returns A VideoOperation for the captioning task
 */
export function captions(options: CaptionsOptions): VideoOperation {
  const { video, captions, model, style } = options;

  if (!captions && !model) {
    throw new Error(
      "You must provide either 'captions' array or a 'model' to generate them.",
    );
  }

  // If captions are provided manually, skip transcription
  if (captions) {
    const params: Record<string, unknown> = {
      transcript: captions,
      style: style,
    };

    if (typeof video === "string") {
      params.videoUrl = video;
    }

    return {
      type: "addSubtitles",
      params,
      inputs: typeof video === "string" ? undefined : [video],
    };
  }

  // If model is provided, create a nested transcribe operation
  const transcribeOp: TranscribeOperation = {
    type: "transcribe",
    params: {
      provider: model!.provider,
      modelId: model!.modelId,
      apiKey: model!.options.apiKey,
    },
  };

  // Create addSubtitles operation with nested transcribe dependency
  const params: Record<string, unknown> = {
    transcript: transcribeOp, // NESTED OPERATION (will be resolved by pipeline)
    style: style,
  };

  if (typeof video === "string") {
    params.videoUrl = video;
  }

  return {
    type: "addSubtitles",
    params,
    inputs: typeof video === "string" ? undefined : [video],
  };
}
