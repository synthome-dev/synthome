import type { AssStyle, CaptionStyle } from "../types/styles";

// Duplicate from speech-to-text to avoid build/link issues during generation
export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

// Helper to format time for ASS: h:mm:ss.cc
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100); // centiseconds
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

/**
 * Convert hex color to ASS color format
 *
 * Supports multiple input formats:
 * - Standard hex: "#RRGGBB" or "#RGB"
 * - Hex without hash: "RRGGBB" or "RGB"
 * - ASS format: "&HAABBGGRR" (returned as-is)
 *
 * ASS format is BGR with alpha: &HAABBGGRR
 * - AA = Alpha (00 = opaque, FF = transparent)
 * - BB = Blue
 * - GG = Green
 * - RR = Red
 *
 * @param color - Color in hex (#RRGGBB) or ASS (&HAABBGGRR) format
 * @returns ASS color format: &HAABBGGRR
 */
function hexToAssColor(color: string): string {
  // Already in ASS format
  if (color.startsWith("&H")) {
    return color;
  }

  // Remove # if present
  let hex = color.replace("#", "");

  // Expand shorthand hex (#RGB -> #RRGGBB)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Parse RGB values
  if (hex.length === 6) {
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);

    // Convert to ASS format: &H00BBGGRR (00 = fully opaque alpha)
    return `&H00${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}`;
  }

  // Invalid format - return as-is and let ASS handle it
  console.warn(`Invalid color format: ${color}. Using as-is.`);
  return color;
}

function generateAssHeader(
  styles: AssStyle[],
  videoWidth: number,
  videoHeight: number,
): string {
  const styleLines = styles
    .map(
      (style) =>
        `Style: ${style.Name},${style.Fontname},${style.Fontsize},${style.PrimaryColour},${style.SecondaryColour},${style.OutlineColour},${style.BackColour},${style.Bold},${style.Italic},${style.Underline},${style.StrikeOut},${style.ScaleX},${style.ScaleY},${style.Spacing},${style.Angle},${style.BorderStyle},${style.Outline},${style.Shadow},${style.Alignment},${style.MarginL},${style.MarginR},${style.MarginV},${style.Encoding}`,
    )
    .join("\n");

  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLines}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
}

/**
 * Group words into caption chunks based on wordsPerCaption setting
 */
function groupWords(
  words: TranscriptWord[],
  wordsPerCaption: number,
  maxDuration: number = 3.0,
  maxChars: number = 50,
): TranscriptWord[][] {
  const groups: TranscriptWord[][] = [];
  let currentGroup: TranscriptWord[] = [];

  for (const word of words) {
    // If we've reached the desired number of words, flush the group
    if (currentGroup.length >= wordsPerCaption) {
      groups.push(currentGroup);
      currentGroup = [];
    }

    // Check duration and character limits
    if (currentGroup.length > 0) {
      const groupStart = currentGroup[0]!.start;
      const groupDuration = word.end - groupStart;
      const groupChars = currentGroup.map((w) => w.word).join(" ").length;

      // If adding this word would exceed limits, flush current group
      if (
        groupDuration > maxDuration ||
        groupChars + word.word.length + 1 > maxChars
      ) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    }

    currentGroup.push(word);
  }

  // Flush remaining
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Generate simple captions without word highlighting
 */
function generateSimpleCaptions(
  wordGroups: TranscriptWord[][],
  styleName: string,
): string {
  let output = "";

  for (const group of wordGroups) {
    if (group.length === 0) continue;

    const firstWord = group[0]!;
    const lastWord = group[group.length - 1]!;
    const text = group.map((w) => w.word.trim()).join(" ");

    output += `Dialogue: 0,${formatAssTime(firstWord.start)},${formatAssTime(lastWord.end)},${styleName},,0,0,0,,${text}\n`;
  }

  return output;
}

/**
 * Generate captions with active word highlighting
 *
 * Strategy: For each word's timing, show the complete phrase with inline style overrides.
 * The active word gets color/scale changes, all others remain in base style.
 *
 * This prevents double vision by showing only ONE caption per time period.
 */
function generateHighlightedCaptions(
  wordGroups: TranscriptWord[][],
  baseStyleName: string,
  activeStyleName: string,
  activeColor: string,
  activeScale?: number,
  animationStyle?: string,
): string {
  let output = "";

  for (const group of wordGroups) {
    if (group.length === 0) continue;

    // For each word in the group, create ONE dialogue line showing ALL words
    // with the current word highlighted via color override
    for (let i = 0; i < group.length; i++) {
      const currentWord = group[i]!;
      const wordStart = currentWord.start;
      const wordEnd = currentWord.end;

      // Build the complete phrase with color overrides
      // Use baseStyleName which has the inactive color
      output += `Dialogue: 0,${formatAssTime(wordStart)},${formatAssTime(wordEnd)},${baseStyleName},,0,0,0,,`;

      for (let j = 0; j < group.length; j++) {
        if (j > 0) output += " "; // Space between words

        const word = group[j]!.word.trim();

        if (j === i) {
          // This is the active word - apply styling based on animation type
          let tags = "";

          // Apply color change
          tags += `{\\c${activeColor}}`;

          // Apply scale if configured
          if (activeScale && activeScale !== 1.0) {
            const scalePercent = Math.round(activeScale * 100);
            tags += `{\\fscx${scalePercent}\\fscy${scalePercent}}`;
          }

          // Apply the word with tags and reset
          output += `${tags}${word}{\\r}`;
        } else {
          // This is an inactive word - use base style color (no override needed)
          output += word;
        }
      }
      output += "\n";
    }
  }

  return output;
}

export function generateAssSubtitles(
  words: TranscriptWord[],
  baseStyle: AssStyle,
  captionConfig: CaptionStyle,
  videoWidth: number = 1080,
  videoHeight: number = 1920,
): string {
  // Extract configuration
  const wordsPerCaption = captionConfig.wordsPerCaption ?? 3;
  const highlightActive = captionConfig.highlightActiveWord ?? false;
  const maxDuration = captionConfig.maxCaptionDuration ?? 3.0;
  const maxChars = captionConfig.maxCaptionChars ?? 50;

  // Prepare styles
  const styles: AssStyle[] = [baseStyle];

  // If highlighting is enabled, create a second style for active words
  let activeStyle: AssStyle | undefined;
  if (highlightActive && captionConfig.activeWordColor) {
    // Convert color to ASS format (supports hex input)
    const activeColorASS = hexToAssColor(captionConfig.activeWordColor);

    activeStyle = {
      ...baseStyle,
      Name: "Active",
      PrimaryColour: activeColorASS,
    };

    // Also update base style to use inactive color if provided
    if (captionConfig.inactiveWordColor) {
      baseStyle.PrimaryColour = hexToAssColor(captionConfig.inactiveWordColor);
    }

    styles.push(activeStyle);
  }

  // Generate header with all styles
  let output = generateAssHeader(styles, videoWidth, videoHeight);

  // Group words
  const wordGroups = groupWords(words, wordsPerCaption, maxDuration, maxChars);

  // Generate captions based on highlighting setting
  if (highlightActive && activeStyle) {
    output += generateHighlightedCaptions(
      wordGroups,
      baseStyle.Name,
      activeStyle.Name,
      activeStyle.PrimaryColour,
      captionConfig.activeWordScale,
      captionConfig.animationStyle,
    );
  } else {
    output += generateSimpleCaptions(wordGroups, baseStyle.Name);
  }

  return output;
}
