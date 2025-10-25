# Step 7: Reframe Video Job

## Overview

Create job handler for changing video aspect ratio using FFmpeg service.

## Files to Create/Modify

- `packages/jobs/src/jobs/pipeline/reframe-video-job.ts`
- `apps/ffmpeg/index.ts` (add /reframe endpoint)

## FFmpeg Endpoint

### apps/ffmpeg/index.ts

```typescript
app.post("/reframe", async (c) => {
  const { videoUrl, aspectRatio, crop } = await c.req.json();

  // aspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
  // crop: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'smart'

  return new Promise((resolve, reject) => {
    const output = `/tmp/reframed-${Date.now()}.mp4`;

    const [width, height] = this.getTargetDimensions(aspectRatio);

    let cropFilter = "";
    if (crop === "center") {
      cropFilter = `crop=${width}:${height}`;
    } else if (crop === "smart") {
      // Use cropdetect for smart cropping
      cropFilter = `cropdetect,crop=${width}:${height}`;
    } else {
      // Position-based crop
      cropFilter = this.buildCropFilter(width, height, crop);
    }

    ffmpeg(videoUrl)
      .videoFilters([cropFilter, `scale=${width}:${height}`])
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

function getTargetDimensions(aspectRatio: string): [number, number] {
  const ratios: Record<string, [number, number]> = {
    "16:9": [1920, 1080],
    "9:16": [1080, 1920],
    "1:1": [1080, 1080],
    "4:5": [1080, 1350],
  };
  return ratios[aspectRatio] || [1920, 1080];
}

function buildCropFilter(
  width: number,
  height: number,
  position: string,
): string {
  const positions: Record<string, string> = {
    top: `crop=${width}:${height}:0:0`,
    bottom: `crop=${width}:${height}:0:oh-${height}`,
    left: `crop=${width}:${height}:0:0`,
    right: `crop=${width}:${height}:ow-${width}:0`,
  };
  return positions[position] || `crop=${width}:${height}`;
}
```

## Job Handler

### reframe-video-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { db } from "@repo/db";
import { executionJobs } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import { uploadToS3 } from "@repo/storage";

interface ReframeVideoParams {
  executionId: string;
  jobId: string;
  input: string; // Job ID
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  crop?: "center" | "top" | "bottom" | "left" | "right" | "smart";
}

export class ReframeVideoJob extends BaseJob<ReframeVideoParams> {
  async execute(data: ReframeVideoParams): Promise<void> {
    await this.updateStatus("in_progress");

    try {
      const inputUrl = await this.getInputUrl(data.input);

      const reframedBuffer = await this.reframeVideo(
        inputUrl,
        data.aspectRatio,
        data.crop || "center",
      );

      const s3Url = await this.uploadResult(reframedBuffer, data);

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

  private async reframeVideo(
    url: string,
    aspectRatio: string,
    crop: string,
  ): Promise<Buffer> {
    const response = await fetch(`${process.env.FFMPEG_API_URL}/reframe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: url,
        aspectRatio,
        crop,
      }),
    });

    const { buffer } = await response.json();
    return Buffer.from(buffer, "base64");
  }

  private async uploadResult(
    buffer: Buffer,
    data: ReframeVideoParams,
  ): Promise<string> {
    const key = `executions/${data.executionId}/${data.jobId}/reframed.mp4`;
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
jobManager.registerJob("pipeline:reframe-video", ReframeVideoJob);
```

## Completion Criteria

- [ ] FFmpeg /reframe endpoint implemented
- [ ] Supports multiple aspect ratios
- [ ] Smart cropping works
- [ ] Job handler complete
- [ ] Job registered
