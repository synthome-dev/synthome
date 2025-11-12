/**
 * Retrieves the SYNTHOME_API_KEY from environment variables or options
 * @param providedKey - Optional API key provided directly
 * @returns The API key if found
 * @throws Error if API key is not found
 */
export function getSynthomeApiKey(providedKey?: string): string {
  // First check if provided directly
  if (providedKey) {
    return providedKey;
  }

  // Then check environment variable
  if (typeof process !== "undefined" && process.env) {
    const envKey = process.env.SYNTHOME_API_KEY;
    if (envKey) {
      return envKey;
    }
  }

  throw new Error(
    "SYNTHOME_API_KEY is required. Set it as an environment variable or pass it in config options."
  );
}

/**
 * Tries to retrieve the SYNTHOME_API_KEY without throwing an error
 * @param providedKey - Optional API key provided directly
 * @returns The API key if found, undefined otherwise
 */
export function tryGetSynthomeApiKey(providedKey?: string): string | undefined {
  if (providedKey) {
    return providedKey;
  }

  if (typeof process !== "undefined" && process.env) {
    return process.env.SYNTHOME_API_KEY;
  }

  return undefined;
}
