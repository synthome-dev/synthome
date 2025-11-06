# Step 5: Generate Video Job

## Overview

Create the job handler for AI video generation using Replicate, Fal, and Google Cloud providers.

## Files to Create

- `packages/jobs/src/jobs/pipeline/generate-video-job.ts`
- `packages/providers/src/services/replicate-service.ts`
- `packages/providers/src/services/fal-service.ts`
- `packages/providers/src/services/google-cloud-service.ts`

## Job Handler

### generate-video-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { replicateService } from "@repo/providers/replicate-service";
import { falService } from "@repo/providers/fal-service";
import { googleCloudService } from "@repo/providers/google-cloud-service";
import { uploadToS3 } from "@repo/storage";
import { db } from "@repo/db";
import { executionJobs, executions } from "@repo/db/schema";
import { eq } from "drizzle-orm";

interface GenerateVideoParams {
  executionId: string;
  jobId: string;
  provider: "replicate" | "fal" | "google-cloud";
  model: string;
  params: Record<string, any>;
}

export class GenerateVideoJob extends BaseJob<GenerateVideoParams> {
  async execute(data: GenerateVideoParams): Promise<void> {
    await this.updateJobStatus("in_progress");

    try {
      // Call provider
      const videoUrl = await this.callProvider(data);

      // Upload to our S3
      const s3Url = await this.uploadVideo(
        videoUrl,
        data.executionId,
        data.jobId,
      );

      // Save result
      await this.saveResult(data, s3Url);

      await this.updateJobStatus("completed");
    } catch (error) {
      await this.updateJobStatus("failed", error);
      throw error;
    }
  }

  private async callProvider(data: GenerateVideoParams): Promise<string> {
    switch (data.provider) {
      case "replicate":
        return await replicateService.generateVideo(data.model, data.params);
      case "fal":
        return await falService.generateVideo(data.model, data.params);
      case "google-cloud":
        return await googleCloudService.generateVideo(data.model, data.params);
      default:
        throw new Error(`Unknown provider: ${data.provider}`);
    }
  }

  private async uploadVideo(
    url: string,
    executionId: string,
    jobId: string,
  ): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const key = `executions/${executionId}/${jobId}/output.mp4`;
    return await uploadToS3(Buffer.from(buffer), key, "video/mp4");
  }

  private async saveResult(data: GenerateVideoParams, url: string) {
    await db
      .update(executionJobs)
      .set({
        status: "completed",
        result: { url },
        completedAt: new Date(),
      })
      .where(eq(executionJobs.jobId, data.jobId));
  }

  private async updateJobStatus(status: string, error?: any) {
    const update: any = { status };
    if (error) {
      update.error = error.message;
    }

    await db
      .update(executionJobs)
      .set(update)
      .where(eq(executionJobs.jobId, this.jobData.jobId));
  }
}
```

## Provider Services

### replicate-service.ts

```typescript
import Replicate from "replicate";

class ReplicateService {
  private client: Replicate;

  constructor() {
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_KEY!,
    });
  }

  async generateVideo(
    model: string,
    params: Record<string, any>,
  ): Promise<string> {
    const output = await this.client.run(model as any, { input: params });

    if (Array.isArray(output)) {
      return output[0];
    }
    return output as string;
  }

  async pollStatus(predictionId: string): Promise<any> {
    return await this.client.predictions.get(predictionId);
  }
}

export const replicateService = new ReplicateService();
```

### fal-service.ts

```typescript
import * as fal from "@fal-ai/serverless-client";

class FalService {
  constructor() {
    fal.config({
      credentials: process.env.FAL_KEY!,
    });
  }

  async generateVideo(
    model: string,
    params: Record<string, any>,
  ): Promise<string> {
    const result = await fal.subscribe(model, {
      input: params,
    });

    return result.video?.url || result.data?.video?.url;
  }
}

export const falService = new FalService();
```

### google-cloud-service.ts

```typescript
import { VertexAI } from "@google-cloud/vertexai";

class GoogleCloudService {
  private vertex: VertexAI;

  constructor() {
    this.vertex = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT!,
      location: "us-central1",
    });
  }

  async generateVideo(
    model: string,
    params: Record<string, any>,
  ): Promise<string> {
    const generativeModel = this.vertex.getGenerativeModel({ model });

    const result = await generativeModel.generateContent(params);

    // Extract video URL from response
    return result.response.candidates[0].content.parts[0].fileData.fileUri;
  }
}

export const googleCloudService = new GoogleCloudService();
```

## Register Job

In `packages/jobs/src/index.ts`:

```typescript
import { GenerateVideoJob } from "./jobs/pipeline/generate-video-job";

jobManager.registerJob("pipeline:generate-video", GenerateVideoJob);
```

## Completion Criteria

- [ ] Job handler created
- [ ] All three provider services implemented
- [ ] Videos uploaded to S3
- [ ] Results saved to database
- [ ] Job registered with JobManager
