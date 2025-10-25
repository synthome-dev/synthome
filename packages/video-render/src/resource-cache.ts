// Enhanced resource cache with proper cleanup
export class ResourceCache {
  private cache = new Map<
    string,
    { blob: Blob; objectUrl: string; refCount: number }
  >();
  private loadingPromises = new Map<string, Promise<string>>();

  async getOrCreateResource(
    url: string,
    type: "video" | "audio"
  ): Promise<string> {
    // Check if already cached
    const cached = this.cache.get(url);
    if (cached) {
      cached.refCount++;
      return cached.objectUrl;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(url);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Start loading
    const promise = this.loadResource(url, type);
    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private async loadResource(
    url: string,
    type: "video" | "audio"
  ): Promise<string> {
    let blob: Blob;

    if (type === "audio") {
      try {
        blob = this.base64ToBlob(url);
      } catch (error) {
        console.error(`Failed to convert base64 audio for ${url}:`, error);
        throw new Error(`Invalid base64 audio data for ${url}`);
      }
    } else {
      // Retry logic for video fetching
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          blob = await response.blob();
          break;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Fetch attempt ${attempt} failed for ${url}:`, error);

          if (attempt < 3) {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      if (!blob!) {
        throw new Error(
          `Failed to fetch video after 3 attempts: ${lastError?.message}`
        );
      }
    }

    // Validate blob
    if (blob.size === 0) {
      throw new Error(`Empty blob received for ${url}`);
    }

    // Create proper blob with correct MIME type
    const resourceBlob = new Blob([blob], {
      type: type === "video" ? "video/mp4" : "audio/mpeg",
    });

    const objectUrl = URL.createObjectURL(resourceBlob);

    this.cache.set(url, {
      blob: resourceBlob,
      objectUrl,
      refCount: 1,
    });

    return objectUrl;
  }

  private base64ToBlob(base64: string, mimeType: string = "audio/mpeg"): Blob {
    if (!base64) {
      throw new Error("Empty base64 string");
    }

    try {
      // Remove data URL prefix if present
      const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;

      if (!base64Data) {
        throw new Error("Invalid base64 format");
      }

      // Decode base64
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });

      if (blob.size === 0) {
        throw new Error("Resulting blob is empty");
      }

      return blob;
    } catch (error) {
      console.error("Base64 conversion failed:", error);
      throw new Error(
        `Base64 conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  releaseResource(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      cached.refCount--;
      if (cached.refCount <= 0) {
        URL.revokeObjectURL(cached.objectUrl);
        this.cache.delete(url);
      }
    }
  }

  clear(): void {
    for (const [url, { objectUrl }] of this.cache) {
      URL.revokeObjectURL(objectUrl);
    }
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loadingPromises.size,
      totalRefCount: Array.from(this.cache.values()).reduce(
        (sum, item) => sum + item.refCount,
        0
      ),
    };
  }
}
