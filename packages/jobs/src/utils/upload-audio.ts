import { storage } from "@repo/storage";
import { generateId } from "@repo/tools";

export interface UploadAudioOptions {
  executionId: string;
  jobId: string;
  organizationId?: string;
}

/**
 * Upload base64-encoded audio to CDN
 * Takes a plain base64 string and uploads as MP3
 */
export async function uploadBase64Audio(
  base64Data: string,
  options: UploadAudioOptions,
): Promise<string> {
  // Convert base64 to Buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Upload to CDN as MP3
  const uploadResult = await storage.upload(
    `audio/${generateId()}.mp3`,
    buffer,
    {
      contentType: "audio/mpeg",
      organizationId: options.organizationId,
    },
  );

  if ("error" in uploadResult) {
    throw new Error(
      `Upload failed: ${uploadResult.error?.message || "Unknown error"}`,
    );
  }

  return uploadResult.url;
}

/**
 * Check if a string looks like base64 (not a URL)
 */
export function isBase64String(str: string): boolean {
  // Base64 strings don't start with http:// or https://
  // They should be long strings of base64 characters
  return (
    !str.startsWith("http://") &&
    !str.startsWith("https://") &&
    str.length > 100
  );
}
