# Step 9: Add Subtitles Job

## Overview

Create job handler for adding captions to videos using video-render service.

## Files to Create

- `packages/jobs/src/jobs/pipeline/add-subtitles-job.ts`

## Job Handler

### add-subtitles-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { db } from "@repo/db";
import { executionJobs } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { uploadToS3 } from "@repo/storage";
import { renderVideoWithCaptions } from "@repo/video-render";

interface AddSubtitlesParams {
  executionId: string;
  jobId: string;
  input: string; // Video job ID
  text: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    position?: "top" | "center" | "bottom";
    animation?: "fade" | "slide" | "typewriter";
  };
  timing?: {
    start: number;
    end: number;
  };
}

export class AddSubtitlesJob extends BaseJob<AddSubtitlesParams> {
  async execute(data: AddSubtitlesParams): Promise<void> {
    await this.updateStatus("in_progress");

    try {
      const videoUrl = await this.getInputUrl(data.input);

      const videoDuration = await this.getVideoDuration(videoUrl);

      const captions = this.formatCaptions(
        data.text,
        data.timing || { start: 0, end: videoDuration },
      );

      const renderedBuffer = await renderVideoWithCaptions({
        videoUrl,
        captions,
        style: data.style || {},
      });

      const s3Url = await this.uploadResult(renderedBuffer, data);

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

  private async getVideoDuration(url: string): Promise<number> {
    const response = await fetch(`${process.env.FFMPEG_API_URL}/probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: url }),
    });

    const { duration } = await response.json();
    return duration;
  }

  private formatCaptions(
    text: string,
    timing: { start: number; end: number },
  ): Array<{ text: string; start: number; end: number }> {
    const words = text.split(" ");
    const wordsPerSecond = 2;
    const duration = timing.end - timing.start;
    const timePerWord = duration / words.length;

    return words.map((word, i) => ({
      text: word,
      start: timing.start + i * timePerWord,
      end: timing.start + (i + 1) * timePerWord,
    }));
  }

  private async uploadResult(
    buffer: Buffer,
    data: AddSubtitlesParams,
  ): Promise<string> {
    const key = `executions/${data.executionId}/${data.jobId}/captioned.mp4`;
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

## FFmpeg Probe Endpoint

Add to `apps/ffmpeg/index.ts`:

```typescript
app.post("/probe", async (c) => {
  const { videoUrl } = await c.req.json();

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        return reject(c.json({ error: err.message }, 500));
      }

      resolve(
        c.json({
          duration: metadata.format.duration,
          width: metadata.streams[0].width,
          height: metadata.streams[0].height,
          codec: metadata.streams[0].codec_name,
        }),
      );
    });
  });
});
```

## Register Job

```typescript
jobManager.registerJob("pipeline:add-subtitles", AddSubtitlesJob);
```

## Completion Criteria

- [ ] Job handler uses video-render service
- [ ] Caption timing calculated correctly
- [ ] Style options supported
- [ ] FFmpeg probe endpoint works
- [ ] Job registered
