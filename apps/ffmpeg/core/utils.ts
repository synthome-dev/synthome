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
