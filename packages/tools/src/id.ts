import { customAlphabet } from "nanoid";

/**
 * Custom alphabet: alphanumeric only (no special characters)
 * Uses: 0-9, a-z, A-Z (62 characters total)
 */
const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Default ID length - provides good uniqueness
 * 21 characters = ~149 bits of entropy
 */
const DEFAULT_LENGTH = 21;

/**
 * Generate a unique ID using nanoid with custom alphanumeric alphabet
 * @param length - Optional length (default: 21)
 * @returns Unique alphanumeric ID
 */
export const generateId = customAlphabet(ALPHABET, DEFAULT_LENGTH);

/**
 * Generate an ID with custom length
 * @param length - Custom length for the ID
 * @returns Unique alphanumeric ID with specified length
 */
export const generateIdWithLength = (length: number): string => {
  const customGenerator = customAlphabet(ALPHABET, length);
  return customGenerator();
};
