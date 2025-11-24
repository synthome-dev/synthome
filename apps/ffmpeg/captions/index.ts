export * from "./types/styles";
export * from "./styles/presets";
export * from "./generators/ass-generator";

import { getStyleForPreset, captionStyleToAssStyle } from "./styles/presets";
import {
  generateAssSubtitles,
  type TranscriptWord,
} from "./generators/ass-generator";
import { writeFile } from "fs/promises";

export class CaptionService {
  /**
   * Generates an ASS subtitle file content string
   */
  generateSubtitleContent(options: {
    words: TranscriptWord[];
    preset?: string; // CaptionPreset
    overrides?: any; // CaptionStyle
    videoWidth?: number;
    videoHeight?: number;
  }): string {
    // Get full caption style config (includes behavior like wordsPerCaption, highlightActiveWord, etc.)
    const captionStyle = getStyleForPreset(
      (options.preset as any) || "tiktok",
      options.overrides,
    );

    // Convert to ASS style definition (for formatting)
    const assStyle = captionStyleToAssStyle(captionStyle);

    // Generate subtitles with both ASS formatting and caption behavior config
    return generateAssSubtitles(
      options.words,
      assStyle,
      captionStyle,
      options.videoWidth,
      options.videoHeight,
    );
  }

  /**
   * Writes the subtitle file to disk
   */
  async createSubtitleFile(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, "utf-8");
  }
}
