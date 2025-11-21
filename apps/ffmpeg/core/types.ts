/**
 * TypeScript type definitions for FFmpeg operations
 */

export interface FFmpegOptions {
  inputFormat?: string;
  outputFormat: string;
  videoCodec?: string;
  audioCodec?: string;
  videoBitrate?: string;
  audioBitrate?: string;
  fps?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  audioChannels?: number;
  audioFrequency?: number;
  startTime?: string;
  duration?: string;
  seek?: string;
  filters?: string[];
}

export interface MergeVideosOptions {
  videos: { url: string }[];
  transition?: {
    type: "fade";
    duration: number;
  };
}

export interface VideoMetadata {
  duration: number; // Duration in seconds
  width: number;
  height: number;
  fps: number;
}

export interface PlacementConfig {
  x: string; // X position (can use FFmpeg expressions like "(W-w)/2")
  y: string; // Y position
  width?: string; // Optional width scaling
  height?: string; // Optional height scaling
}

export interface LayerMediaOptions {
  layers: Array<
    | {
        media: string[];
        placement?: string;
        chromaKey?: boolean;
        chromaKeyColor?: string;
        similarity?: number;
        blend?: number;
        isTimeline?: false;
        main?: boolean;
      }
    | {
        isTimeline: true;
        timeline: Array<{
          media: string[];
          placement?: string;
          chromaKey?: boolean;
          chromaKeyColor?: string;
          similarity?: number;
          blend?: number;
          duration?: number;
        }>;
        totalDuration?: number;
        needsAutoDuration?: boolean;
        explicitDuration?: number;
      }
  >;
  outputDuration?: number;
  outputWidth?: number;
  outputHeight?: number;
  mainLayer?: number;
}

export interface ReplaceGreenScreenOptions {
  videoUrl: string;
  backgroundUrls: string[]; // Can be images or videos (videos will be looped to match main video duration)
  chromaKeyColor?: string; // Default: "0x00FF00" (green)
  similarity?: number; // Default: 0.25 (range: 0.0-1.0, balanced green removal)
  blend?: number; // Default: 0.05 (range: 0.0-1.0, minimal edge blending)
}
