export type CaptionPreset =
  | "tiktok"
  | "youtube"
  | "story"
  | "minimal"
  | "cinematic";

export interface CaptionStyle {
  // Font
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | number;
  color?: string; // hex

  // Layout
  alignment?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"; // ASS alignment numpad style (2=bottom-center)
  marginV?: number;
  marginL?: number;
  marginR?: number;

  // Effects
  primaryColor?: string; // &HBBGGRR
  outlineColor?: string; // &HBBGGRR
  backgroundColor?: string; // Background color for text box (supports hex #RRGGBB or ASS &HAABBGGRR)

  outlineWidth?: number;
  shadowDistance?: number;

  // Background Box
  borderStyle?: 1 | 3; // 1=Outline, 3=Opaque Box
  padding?: number; // Padding around text when using opaque box (borderStyle: 3). Uses Outline property internally.
  borderRadius?: number; // Border radius for background box (NOTE: requires custom rendering, not supported in native ASS)

  // Caption Behavior
  wordsPerCaption?: number; // How many words to show at once (1=karaoke style, 3=phrase style)
  maxCaptionDuration?: number; // Max duration in seconds for a caption group (default: 3.0)
  maxCaptionChars?: number; // Max characters per caption (default: 30)

  // Active Word Highlighting
  highlightActiveWord?: boolean; // Enable/disable word highlighting
  activeWordColor?: string; // Color for the currently spoken word (&HBBGGRR format)
  inactiveWordColor?: string; // Color for words not yet spoken (&HBBGGRR format)
  activeWordScale?: number; // Scale multiplier for active word (e.g., 1.2 = 20% bigger)
  animationStyle?: "none" | "color" | "scale" | "glow"; // Type of highlight effect
}

// Internal ASS Style definition
export interface AssStyle {
  Name: string;
  Fontname: string;
  Fontsize: number;
  PrimaryColour: string; // &H00FFFFFF (AABBGGRR)
  SecondaryColour: string;
  OutlineColour: string;
  BackColour: string;
  Bold: number; // -1 or 0
  Italic: number;
  Underline: number;
  StrikeOut: number;
  ScaleX: number;
  ScaleY: number;
  Spacing: number;
  Angle: number;
  BorderStyle: number;
  Outline: number;
  Shadow: number;
  Alignment: number;
  MarginL: number;
  MarginR: number;
  MarginV: number;
  Encoding: number;
}
