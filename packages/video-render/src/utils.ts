export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  abortSignal?: AbortSignal
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (abortSignal?.aborted) {
      throw new Error("Operation aborted");
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // Don't retry on certain types of errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("aborted") ||
          errorMessage.includes("invalid") ||
          errorMessage.includes("malformed")
        ) {
          throw error;
        }
      }

      console.warn(`Attempt ${attempt} failed, retrying...`, error);

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Operation failed after ${maxAttempts} attempts: ${lastError!.message}`
  );
}
