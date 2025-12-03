/**
 * Utility helper functions
 */

export function isVideoFile(filePath: string): boolean {
  const videoExtensions = [
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
    ".flv",
    ".wmv",
  ];
  const ext = filePath.toLowerCase().slice(filePath.lastIndexOf("."));
  return videoExtensions.includes(ext);
}

/**
 * Stream a fetch response directly to disk to avoid loading entire file into RAM.
 * This significantly reduces memory usage when downloading large media files.
 */
export async function streamToDisk(
  url: string,
  outputPath: string,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download from ${url}: ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`No response body from ${url}`);
  }
  // Stream directly to disk - no buffering in RAM
  const file = Bun.file(outputPath);
  const writer = file.writer();
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writer.write(value);
    }
  } finally {
    await writer.end();
  }
}
