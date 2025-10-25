# Step 6: Merge Videos Job

## Overview

Create job handler for merging multiple videos with optional transitions using FFmpeg service.

## Prerequisites

- FFmpeg service needs new endpoint: POST /merge

## Files to Create/Modify

- `packages/jobs/src/jobs/pipeline/merge-videos-job.ts`
- `apps/ffmpeg/index.ts` (add /merge endpoint)

## FFmpeg Service Endpoint

### apps/ffmpeg/index.ts

```typescript
app.post("/merge", async (c) => {
  const { videos, transition } = await c.req.json();

  // videos: [{ url: string, duration?: number }]
  // transition?: { type: 'fade' | 'dissolve' | 'wipe', duration: number }

  return new Promise((resolve, reject) => {
    const output = `/tmp/merged-${Date.now()}.mp4`;

    let command = ffmpeg();

    // Add all input videos
    videos.forEach((video: any) => {
      command = command.input(video.url);
    });

    // Build complex filter for transitions
    if (transition) {
      const filters = this.buildTransitionFilter(videos.length, transition);
      command = command.complexFilter(filters);
    } else {
      // Simple concat
      command = command.complexFilter(
        [`concat=n=${videos.length}:v=1:a=1[outv][outa]`],
        ["outv", "outa"],
      );
    }

    command
      .output(output)
      .on("end", async () => {
        const buffer = await fs.readFile(output);
        await fs.unlink(output);
        resolve(c.json({ buffer: buffer.toString("base64") }));
      })
      .on("error", (err) => {
        reject(c.json({ error: err.message }, 500));
      })
      .run();
  });
});

function buildTransitionFilter(count: number, transition: any): string[] {
  const filters: string[] = [];

  if (transition.type === "fade") {
    let current = "[0:v][0:a]";

    for (let i = 1; i < count; i++) {
      const offset = i * 5; // assuming 5s per clip
      filters.push(
        `${current}[${i}:v][${i}:a]xfade=transition=fade:duration=${transition.duration}:offset=${offset}[v${i}][a${i}]`,
      );
      current = `[v${i}][a${i}]`;
    }

    return filters;
  }

  // Default concat
  return [`concat=n=${count}:v=1:a=1[outv][outa]`];
}
```

## Job Handler

### merge-videos-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { db } from "@repo/db";
import { executionJobs } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { uploadToS3 } from "@repo/storage";

interface MergeVideosParams {
  executionId: string;
  jobId: string;
  inputs: string[]; // Job IDs to merge
  transition?: {
    type: "fade" | "dissolve" | "wipe";
    duration: number;
  };
}

export class MergeVideosJob extends BaseJob<MergeVideosParams> {
  async execute(data: MergeVideosParams): Promise<void> {
    await this.updateStatus("in_progress");

    try {
      // Get input video URLs from dependent jobs
      const inputUrls = await this.getInputUrls(data.inputs);

      // Call FFmpeg service
      const mergedBuffer = await this.mergeVideos(inputUrls, data.transition);

      // Upload result
      const s3Url = await this.uploadResult(mergedBuffer, data);

      // Save result
      await this.saveResult(data.jobId, s3Url);

      await this.updateStatus("completed");
    } catch (error) {
      await this.updateStatus("failed", error);
      throw error;
    }
  }

  private async getInputUrls(jobIds: string[]): Promise<string[]> {
    const jobs = await db
      .select()
      .from(executionJobs)
      .where(
        // @ts-ignore
        jobIds
          .map((id) => eq(executionJobs.jobId, id))
          .reduce((a, b) => or(a, b)),
      );

    return jobs
      .sort((a, b) => jobIds.indexOf(a.jobId) - jobIds.indexOf(b.jobId))
      .map((j) => (j.result as any).url);
  }

  private async mergeVideos(
    urls: string[],
    transition?: MergeVideosParams["transition"],
  ): Promise<Buffer> {
    const response = await fetch(`${process.env.FFMPEG_API_URL}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videos: urls.map((url) => ({ url })),
        transition,
      }),
    });

    const { buffer } = await response.json();
    return Buffer.from(buffer, "base64");
  }

  private async uploadResult(
    buffer: Buffer,
    data: MergeVideosParams,
  ): Promise<string> {
    const key = `executions/${data.executionId}/${data.jobId}/merged.mp4`;
    return await uploadToS3(buffer, key, "video/mp4");
  }

  private async saveResult(jobId: string, url: string) {
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result: { url },
        completedAt: new Date(),
      })
      .where(eq(executionJobs.jobId, jobId));
  }

  private async updateStatus(status: string, error?: any) {
    // Similar to GenerateVideoJob
  }
}
```

## Register Job

```typescript
jobManager.registerJob("pipeline:merge-videos", MergeVideosJob);
```

## Testing

```bash
# Test FFmpeg endpoint
curl -X POST http://localhost:3001/merge \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {"url": "https://example.com/video1.mp4"},
      {"url": "https://example.com/video2.mp4"}
    ],
    "transition": {"type": "fade", "duration": 1}
  }'
```

## Completion Criteria

- [ ] FFmpeg /merge endpoint works
- [ ] Job handler fetches input URLs
- [ ] Videos merged with transitions
- [ ] Result uploaded to S3
- [ ] Job registered
