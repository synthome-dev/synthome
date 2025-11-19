import type { VideoOperation } from "../core/video.js";

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

export interface ReplaceGreenScreenOptions {
  video?: string | VideoOperation;
  background: string | string[];
  chromaKeyColor?: string;
  similarity?: number;
  blend?: number;
}

export function replaceGreenScreen(
  options: ReplaceGreenScreenOptions,
): VideoOperation {
  return {
    type: "replaceGreenScreen",
    params: {
      video: options.video,
      background: options.background,
      chromaKeyColor: options.chromaKeyColor,
      similarity: options.similarity,
      blend: options.blend,
    },
  };
}
