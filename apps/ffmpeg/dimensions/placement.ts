/**
 * Placement parsing and configuration
 */

import type { PlacementConfig } from "../core/types.js";

/**
 * Parse Tailwind-style placement strings like "w-1/4 bottom-right"
 */
export function parseTailwindPlacement(placement: string): PlacementConfig {
  const tokens = placement.toLowerCase().split(/\s+/);

  let width: string | undefined;
  let height: string | undefined;
  let position = "center"; // default position

  for (const token of tokens) {
    if (token.startsWith("w-")) {
      // Width token: w-1/2, w-1/3, w-1/4, etc.
      const fraction = token.substring(2); // Remove "w-"
      width = `iw*${fraction}`;
    } else if (token.startsWith("h-")) {
      // Height token: h-1/2, h-1/3, h-1/4, etc.
      const fraction = token.substring(2); // Remove "h-"
      height = `ih*${fraction}`;
    } else {
      // Position token
      position = token;
    }
  }

  // Get position coordinates
  const positionConfig = getPositionCoordinates(position);

  return {
    width,
    height,
    x: positionConfig.x,
    y: positionConfig.y,
  };
}

/**
 * Get position coordinates for placement
 */
export function getPositionCoordinates(position: string): {
  x: string;
  y: string;
} {
  const positions: Record<string, { x: string; y: string }> = {
    "top-left": { x: "0", y: "0" },
    top: { x: "(W-w)/2", y: "0" },
    "top-center": { x: "(W-w)/2", y: "0" },
    "top-right": { x: "W-w", y: "0" },
    left: { x: "0", y: "(H-h)/2" },
    "center-left": { x: "0", y: "(H-h)/2" },
    center: { x: "(W-w)/2", y: "(H-h)/2" },
    right: { x: "W-w", y: "(H-h)/2" },
    "center-right": { x: "W-w", y: "(H-h)/2" },
    "bottom-left": { x: "0", y: "H-h" },
    bottom: { x: "(W-w)/2", y: "H-h" },
    "bottom-center": { x: "(W-w)/2", y: "(H-h)/2" },
    "bottom-right": { x: "W-w", y: "H-h" },
  };

  return positions[position] || positions["center"];
}

/**
 * Get placement configuration from preset name or Tailwind-style string
 */
export function getPlacementConfig(placement: string): PlacementConfig {
  // Handle simple presets
  const presets: Record<string, PlacementConfig> = {
    full: { x: "0", y: "0", width: "iw", height: "ih" },
    center: { x: "(W-w)/2", y: "(H-h)/2" },
    pip: { x: "W-w-20", y: "H-h-20", width: "iw/4", height: "ih/4" },
    "picture-in-picture": {
      x: "W-w-20",
      y: "H-h-20",
      width: "iw/4",
      height: "ih/4",
    },
  };

  if (presets[placement]) {
    return presets[placement];
  }

  // Parse Tailwind-style string
  return parseTailwindPlacement(placement);
}
