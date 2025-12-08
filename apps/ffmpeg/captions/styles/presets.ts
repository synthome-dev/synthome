import type { AssStyle, CaptionPreset, CaptionStyle } from "../types/styles";

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
 */
export function hexToAssColor(color: string): string {
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

// Default base style
const BASE_STYLE: AssStyle = {
  Name: "Default",
  Fontname: "Arial",
  Fontsize: 20,
  PrimaryColour: "&H00FFFFFF", // White
  SecondaryColour: "&H00000000", // Black
  OutlineColour: "&H00000000", // Black
  BackColour: "&H80000000", // Semi-transparent Black
  Bold: 0,
  Italic: 0,
  Underline: 0,
  StrikeOut: 0,
  ScaleX: 100,
  ScaleY: 100,
  Spacing: 0,
  Angle: 0,
  BorderStyle: 1, // Outline
  Outline: 2,
  Shadow: 0,
  Alignment: 2, // Bottom Center
  MarginL: 10,
  MarginR: 10,
  MarginV: 10,
  Encoding: 1,
};

export const PRESETS: Record<CaptionPreset, Partial<CaptionStyle>> = {
  tiktok: {
    fontFamily: "Arial",
    fontSize: 80, // Larger for 1080x1920 vertical video
    fontWeight: "bold",
    color: "&H00FFFFFF",
    outlineColor: "&H00000000",
    outlineWidth: 3, // Increased outline for better visibility
    shadowDistance: 0,
    alignment: "2", // Bottom Center
    marginV: 250, // Higher up for TikTok UI
    // TikTok style: One word at a time with yellow highlight and scale
    wordsPerCaption: 1,
    highlightActiveWord: true,
    activeWordColor: "&H0000FFFF", // Yellow (AABBGGRR format)
    inactiveWordColor: "&H00AAAAAA", // Gray
    activeWordScale: 1.2, // 20% larger for emphasis
    animationStyle: "scale",
  },
  youtube: {
    fontFamily: "Arial",
    fontSize: 48, // Larger for better readability
    color: "&H00FFFFFF",
    backgroundColor: "&H80000000",
    borderStyle: 3, // Opaque box
    alignment: "2",
    marginV: 100,
    // YouTube style: Longer phrases, no highlighting
    wordsPerCaption: 5,
    highlightActiveWord: false,
  },
  story: {
    fontFamily: "Courier New",
    fontSize: 52,
    color: "&H00FFFF00", // Cyan/Yellow-ish
    outlineWidth: 0,
    backgroundColor: "&H40000000",
    borderStyle: 3,
    alignment: "5", // Center screen
    // Story style: Medium phrases with subtle highlight and scale
    wordsPerCaption: 3,
    highlightActiveWord: true,
    activeWordColor: "&H00FFFFFF", // White
    inactiveWordColor: "&H00888888", // Darker gray
    activeWordScale: 1.15, // Subtle 15% scale
    animationStyle: "scale",
  },
  minimal: {
    fontFamily: "Helvetica",
    fontSize: 42,
    color: "&H00DDDDDD",
    outlineWidth: 2,
    alignment: "2",
    marginV: 80,
    // Minimal style: Clean, no effects
    wordsPerCaption: 4,
    highlightActiveWord: false,
  },
  cinematic: {
    fontFamily: "Times New Roman",
    fontSize: 40,
    color: "&H00E0E0E0",
    outlineWidth: 0,
    shadowDistance: 2,
    alignment: "2", // Bottom
    marginV: 120, // Letterbox area usually
    // Cinematic: Longer phrases, subtle styling
    wordsPerCaption: 6,
    highlightActiveWord: false,
  },
};

/**
 * Get the merged caption style configuration
 */
export function getStyleForPreset(
  preset: CaptionPreset,
  overrides?: Partial<CaptionStyle>,
): CaptionStyle {
  const presetConfig = PRESETS[preset];

  // Merge: Preset -> Overrides
  const merged: CaptionStyle = {
    ...presetConfig,
    ...overrides,
  };

  return merged;
}

/**
 * Convert CaptionStyle to ASS style definition
 */
export function captionStyleToAssStyle(
  style: CaptionStyle,
  styleName: string = "Default",
): AssStyle {
  const assStyle: AssStyle = { ...BASE_STYLE, Name: styleName };

  if (style.fontFamily) assStyle.Fontname = style.fontFamily;
  if (style.fontSize) assStyle.Fontsize = style.fontSize;

  // Handle font weight - explicitly set bold or normal
  if (style.fontWeight === "bold" || style.fontWeight === 700) {
    assStyle.Bold = -1; // Bold in ASS
  } else if (style.fontWeight === "normal" || style.fontWeight === 400) {
    assStyle.Bold = 0; // Normal weight
  }

  // Convert colors from hex (#RRGGBB) to ASS format (&HAABBGGRR)
  if (style.color) assStyle.PrimaryColour = hexToAssColor(style.color);
  if (style.outlineColor)
    assStyle.OutlineColour = hexToAssColor(style.outlineColor);

  // Determine if we're using opaque box mode
  const usingOpaqueBox =
    style.backgroundColor &&
    (style.borderStyle === undefined || style.borderStyle === 3);

  if (style.backgroundColor) {
    assStyle.BackColour = hexToAssColor(style.backgroundColor);
    // When backgroundColor is provided without explicit borderStyle,
    // automatically use opaque box (3) to make the background visible
    if (style.borderStyle === undefined) {
      assStyle.BorderStyle = 3;
    }
  }

  // Handle Outline property - it means different things based on BorderStyle:
  // BorderStyle 1 (outline): Outline = stroke width around text
  // BorderStyle 3 (opaque box): Outline = padding around text
  if (usingOpaqueBox) {
    // Use boxPadding for opaque box mode
    assStyle.Outline = style.padding ?? 10;
  } else if (style.outlineWidth !== undefined) {
    // Use outlineWidth for outline mode
    assStyle.Outline = style.outlineWidth;
  }

  if (style.shadowDistance !== undefined)
    assStyle.Shadow = style.shadowDistance;
  if (style.borderStyle) assStyle.BorderStyle = style.borderStyle;
  if (style.alignment) assStyle.Alignment = parseInt(style.alignment);
  if (style.marginV) assStyle.MarginV = style.marginV;
  if (style.marginL) assStyle.MarginL = style.marginL;
  if (style.marginR) assStyle.MarginR = style.marginR;

  return assStyle;
}
