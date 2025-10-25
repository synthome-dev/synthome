# Step 8: Lip Sync Job

## Overview

Create job handler for replacing audio in video using FFmpeg service.

## Files to Create/Modify

- `packages/jobs/src/jobs/pipeline/lip-sync-job.ts`
- `apps/ffmpeg/index.ts` (add /add-audio endpoint)

## FFmpeg Endpoint

### apps/ffmpeg/index.ts

```typescript
app.post("/add-audio", async (c) => {
  const { videoUrl, audioUrl, volume } = await c.req.json();

  // volume: 0-1 (optional, default 1.0)

  return new Promise((resolve, reject) => {
    const output = `/tmp/audio-replaced-${Date.now()}.mp4`;

    let command = ffmpeg().input(videoUrl).input(audioUrl).outputOptions([
      "-c:v copy", // Copy video stream
      "-map 0:v:0", // Map video from first input
      "-map 1:a:0", // Map audio from second input
      "-shortest", // Match shortest stream
    ]);

    if (volume && volume !== 1.0) {
      command = command.audioFilters([`volume=${volume}`]);
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
```

## Job Handler

### lip-sync-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { db } from "@repo/db";
import { executionJobs } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { uploadToS3 } from "@repo/storage";

interface LipSyncParams {
  executionId: string;
  jobId: string;
  input: string; // Video job ID
  audioUrl: string;
  volume?: number;
}

export class LipSyncJob extends BaseJob<LipSyncParams> {
  async execute(data: LipSyncParams): Promise<void> {
    await this.updateStatus("in_progress");

    try {
      const videoUrl = await this.getInputUrl(data.input);

      const syncedBuffer = await this.addAudio(
        videoUrl,
        data.audioUrl,
        data.volume,
      );

      const s3Url = await this.uploadResult(syncedBuffer, data);

      await this.saveResult(data.jobId, s3Url);

      await this.updateStatus("completed");
    } catch (error) {
      await this.updateStatus("failed", error);
      throw error;
    }
  }

  private async getInputUrl(jobId: string): Promise<string> {
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.jobId, jobId))
      .limit(1);

    return (job.result as any).url;
  }

  private async addAudio(
    videoUrl: string,
    audioUrl: string,
    volume?: number,
  ): Promise<Buffer> {
    const response = await fetch(`${process.env.FFMPEG_API_URL}/add-audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl,
        audioUrl,
        volume: volume || 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`FFmpeg service error: ${response.statusText}`);
    }

    const { buffer } = await response.json();
    return Buffer.from(buffer, "base64");
  }

  private async uploadResult(
    buffer: Buffer,
    data: LipSyncParams,
  ): Promise<string> {
    const key = `executions/${data.executionId}/${data.jobId}/synced.mp4`;
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
    const update: any = { status };
    if (error) update.error = error.message;

    await db
      .update(executionJobs)
      .set(update)
      .where(eq(executionJobs.jobId, this.jobData.jobId));
  }
}
```

## Register Job

```typescript
jobManager.registerJob("pipeline:lip-sync", LipSyncJob);
```

## Testing

```bash
curl -X POST http://localhost:3001/add-audio \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "audioUrl": "https://example.com/audio.mp3",
    "volume": 0.8
  }'
```

## Completion Criteria

- [ ] FFmpeg /add-audio endpoint works
- [ ] Volume control implemented
- [ ] Handles different audio formats
- [ ] Job handler complete
- [ ] Job registered
