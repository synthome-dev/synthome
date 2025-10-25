# Step 17: Provider Abstraction Layer

## Overview

Create a unified interface for all video generation providers.

## Files to Create

- `packages/providers/src/base-provider.ts`
- `packages/providers/src/provider-factory.ts`

## Base Provider Interface

### base-provider.ts

```typescript
export interface VideoGenerationParams {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  seed?: number;
  [key: string]: any;
}

export interface VideoGenerationResult {
  url: string;
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    seed?: number;
  };
}

export abstract class BaseVideoProvider {
  abstract name: string;

  abstract generateVideo(
    model: string,
    params: VideoGenerationParams,
  ): Promise<VideoGenerationResult>;

  abstract pollStatus(jobId: string): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    result?: VideoGenerationResult;
    error?: string;
  }>;

  protected normalizeParams(
    params: VideoGenerationParams,
  ): Record<string, any> {
    return params;
  }

  protected async waitForCompletion(
    jobId: string,
    maxWaitMs: number = 300000,
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.pollStatus(jobId);

      if (status.status === "completed" && status.result) {
        return status.result;
      }

      if (status.status === "failed") {
        throw new Error(`Generation failed: ${status.error}`);
      }

      await this.sleep(5000);
    }

    throw new Error("Generation timeout");
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

## Provider Factory

### provider-factory.ts

```typescript
import { ReplicateProvider } from "./providers/replicate";
import { FalProvider } from "./providers/fal";
import { GoogleCloudProvider } from "./providers/google-cloud";
import { BaseVideoProvider } from "./base-provider";

export class ProviderFactory {
  private static providers = new Map<string, BaseVideoProvider>();

  static getProvider(name: string): BaseVideoProvider {
    if (!this.providers.has(name)) {
      const provider = this.createProvider(name);
      this.providers.set(name, provider);
    }

    return this.providers.get(name)!;
  }

  private static createProvider(name: string): BaseVideoProvider {
    switch (name) {
      case "replicate":
        return new ReplicateProvider();
      case "fal":
        return new FalProvider();
      case "google-cloud":
        return new GoogleCloudProvider();
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
}
```

## Update Providers to Use Base Class

### providers/replicate.ts

```typescript
import Replicate from "replicate";
import {
  BaseVideoProvider,
  VideoGenerationParams,
  VideoGenerationResult,
} from "../base-provider";

export class ReplicateProvider extends BaseVideoProvider {
  name = "replicate";
  private client: Replicate;

  constructor() {
    super();
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_KEY!,
    });
  }

  async generateVideo(
    model: string,
    params: VideoGenerationParams,
  ): Promise<VideoGenerationResult> {
    const output = await this.client.run(model as any, {
      input: this.normalizeParams(params),
    });

    const url = Array.isArray(output) ? output[0] : (output as string);

    return { url };
  }

  async pollStatus(predictionId: string) {
    const prediction = await this.client.predictions.get(predictionId);

    return {
      status: this.mapStatus(prediction.status),
      result: prediction.output ? { url: prediction.output } : undefined,
      error: prediction.error?.toString(),
    };
  }

  private mapStatus(status: string) {
    const statusMap: Record<string, any> = {
      starting: "pending",
      processing: "processing",
      succeeded: "completed",
      failed: "failed",
      canceled: "failed",
    };
    return statusMap[status] || "pending";
  }
}
```

## Update GenerateVideoJob

```typescript
import { ProviderFactory } from "@repo/providers/provider-factory";

export class GenerateVideoJob extends BaseJob<GenerateVideoParams> {
  async execute(data: GenerateVideoParams): Promise<void> {
    const provider = ProviderFactory.getProvider(data.provider);

    const result = await provider.generateVideo(data.model, data.params);

    const s3Url = await this.uploadVideo(
      result.url,
      data.executionId,
      data.jobId,
    );

    await this.saveResult(data.jobId, s3Url, result.metadata);
  }
}
```

## Completion Criteria

- [ ] Base provider interface defined
- [ ] All providers implement interface
- [ ] Provider factory manages instances
- [ ] Jobs use provider factory
- [ ] Consistent error handling across providers
