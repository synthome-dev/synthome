import type { VideoJob } from "../core/types.js";

const DEFAULT_POLLING_INTERVAL = 3000;
const DEFAULT_MAX_ATTEMPTS = 100;

export async function pollJobStatus(
  jobId: string,
  fetchStatus: (jobId: string) => Promise<VideoJob>,
  onProgress?: (job: VideoJob) => void,
): Promise<VideoJob> {
  let attempts = 0;

  while (attempts < DEFAULT_MAX_ATTEMPTS) {
    const job = await fetchStatus(jobId);

    if (onProgress) {
      onProgress(job);
    }

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Video generation failed");
    }

    await new Promise((resolve) =>
      setTimeout(resolve, DEFAULT_POLLING_INTERVAL),
    );
    attempts++;
  }

  throw new Error("Polling timeout: maximum attempts reached");
}
