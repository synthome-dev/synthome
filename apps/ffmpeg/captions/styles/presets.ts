import type { AssStyle, CaptionPreset, CaptionStyle } from "../types/styles";

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
    backColor: "&H80000000",
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
    backColor: "&H40000000",
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
  if (style.fontWeight === "bold" || style.fontWeight === 700)
    assStyle.Bold = -1;
  if (style.color) assStyle.PrimaryColour = style.color;
  if (style.outlineColor) assStyle.OutlineColour = style.outlineColor;
  if (style.backColor) assStyle.BackColour = style.backColor;
  if (style.outlineWidth !== undefined) assStyle.Outline = style.outlineWidth;
  if (style.shadowDistance !== undefined)
    assStyle.Shadow = style.shadowDistance;
  if (style.borderStyle) assStyle.BorderStyle = style.borderStyle;
  if (style.alignment) assStyle.Alignment = parseInt(style.alignment);
  if (style.marginV) assStyle.MarginV = style.marginV;
  if (style.marginL) assStyle.MarginL = style.marginL;
  if (style.marginR) assStyle.MarginR = style.marginR;

  return assStyle;
}
