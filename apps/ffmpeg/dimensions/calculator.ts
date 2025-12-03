/**
 * Calculate dimensions and evaluate placement expressions
 */

import type { PlacementConfig } from "../core/types.js";

/**
 * Ensure a dimension is even (divisible by 2) for FFmpeg compatibility
 * libx264 with yuv420p pixel format requires even dimensions
 */
export function ensureEven(value: number): number {
  return Math.floor(value / 2) * 2;
}

/**
 * Evaluate a dimension expression (e.g., "iw/2" -> 360)
 */
export function evaluateDimensionExpression(
  expr: string,
  bgWidth: number,
  bgHeight: number,
): number {
  // Replace iw with background width, ih with background height
  let evaluated = expr
    .replace(/iw/g, bgWidth.toString())
    .replace(/ih/g, bgHeight.toString());

  // Evaluate the expression
  try {
    // Safe eval: only allow numbers and basic math operators
    if (!/^[\d\s+\-*/().]+$/.test(evaluated)) {
      throw new Error(`Unsafe expression: ${evaluated}`);
    }
    return Math.floor(eval(evaluated));
  } catch (e) {
    throw new Error(`Failed to evaluate expression "${expr}": ${e}`);
  }
}

/**
 * Evaluate a position expression (e.g., "H-h" -> 920)
 */
export function evaluatePositionExpression(
  expr: string,
  bgWidth: number,
  bgHeight: number,
  overlayWidth: number,
  overlayHeight: number,
): number {
  // Replace W/H with background, w/h with overlay
  let evaluated = expr
    .replace(/W/g, bgWidth.toString())
    .replace(/H/g, bgHeight.toString())
    .replace(/w/g, overlayWidth.toString())
    .replace(/h/g, overlayHeight.toString());

  // Evaluate the expression
  try {
    // Safe eval: only allow numbers and basic math operators
    if (!/^[\d\s+\-*/().]+$/.test(evaluated)) {
      throw new Error(`Unsafe expression: ${evaluated}`);
    }
    return Math.floor(eval(evaluated));
  } catch (e) {
    throw new Error(`Failed to evaluate expression "${expr}": ${e}`);
  }
}

/**
 * Calculate final dimensions and position for an overlay
 */
export function calculateLayerDimensions(
  bgWidth: number,
  bgHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  placementConfig: PlacementConfig,
): { width: number; height: number; x: number; y: number } {
  let scaledWidth: number;
  let scaledHeight: number;

  // Calculate scaled dimensions preserving aspect ratio
  // All dimensions are made even for FFmpeg libx264/yuv420p compatibility
  if (placementConfig.width && !placementConfig.height) {
    // Width specified: calculate from expression, preserve aspect ratio
    scaledWidth = ensureEven(
      evaluateDimensionExpression(placementConfig.width, bgWidth, bgHeight),
    );
    // Preserve overlay aspect ratio
    scaledHeight = ensureEven(scaledWidth * (overlayHeight / overlayWidth));
  } else if (placementConfig.height && !placementConfig.width) {
    // Height specified: calculate from expression, preserve aspect ratio
    scaledHeight = ensureEven(
      evaluateDimensionExpression(placementConfig.height, bgWidth, bgHeight),
    );
    // Preserve overlay aspect ratio
    scaledWidth = ensureEven(scaledHeight * (overlayWidth / overlayHeight));
  } else if (placementConfig.width && placementConfig.height) {
    // Both specified: use both values
    scaledWidth = ensureEven(
      evaluateDimensionExpression(placementConfig.width, bgWidth, bgHeight),
    );
    scaledHeight = ensureEven(
      evaluateDimensionExpression(placementConfig.height, bgWidth, bgHeight),
    );
  } else {
    // No scaling specified: use original dimensions (made even)
    scaledWidth = ensureEven(overlayWidth);
    scaledHeight = ensureEven(overlayHeight);
  }

  // Calculate position
  const x = evaluatePositionExpression(
    placementConfig.x,
    bgWidth,
    bgHeight,
    scaledWidth,
    scaledHeight,
  );
  const y = evaluatePositionExpression(
    placementConfig.y,
    bgWidth,
    bgHeight,
    scaledWidth,
    scaledHeight,
  );

  console.log(`[DimensionCalc] Background: ${bgWidth}x${bgHeight}`);
  console.log(
    `[DimensionCalc] Overlay original: ${overlayWidth}x${overlayHeight}`,
  );
  console.log(`[DimensionCalc] Overlay scaled: ${scaledWidth}x${scaledHeight}`);
  console.log(`[DimensionCalc] Position: (${x}, ${y})`);

  return { width: scaledWidth, height: scaledHeight, x, y };
}
