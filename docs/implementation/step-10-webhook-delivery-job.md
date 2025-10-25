# Step 10: Webhook Delivery Job

## Overview

Create job handler for delivering execution results to webhook URLs with retry logic.

## Files to Create

- `packages/jobs/src/jobs/pipeline/webhook-delivery-job.ts`

## Job Handler

### webhook-delivery-job.ts

```typescript
import { BaseJob } from "../../core/base-job";
import { db } from "@repo/db";
import { executions, executionJobs } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface WebhookDeliveryParams {
  executionId: string;
  webhookUrl: string;
  webhookSecret?: string;
}

export class WebhookDeliveryJob extends BaseJob<WebhookDeliveryParams> {
  async execute(data: WebhookDeliveryParams): Promise<void> {
    try {
      const executionData = await this.getExecutionData(data.executionId);

      const payload = this.buildPayload(executionData);

      const signature = this.generateSignature(payload, data.webhookSecret);

      await this.deliverWebhook(data.webhookUrl, payload, signature);

      await this.markExecutionComplete(data.executionId, executionData);
    } catch (error) {
      console.error("Webhook delivery failed:", error);
      throw error;
    }
  }

  private async getExecutionData(executionId: string) {
    const [execution] = await db
      .select()
      .from(executions)
      .where(eq(executions.id, executionId))
      .limit(1);

    const jobs = await db
      .select()
      .from(executionJobs)
      .where(eq(executionJobs.executionId, executionId));

    return { execution, jobs };
  }

  private buildPayload(data: any) {
    const { execution, jobs } = data;

    const rootJob = jobs.find(
      (j: any) => !j.dependencies || j.dependencies.length === 0,
    );

    const outputs = jobs.reduce((acc: any, job: any) => {
      if (job.result?.url) {
        acc[job.jobId] = {
          url: job.result.url,
          operation: job.operation,
        };
      }
      return acc;
    }, {});

    return {
      executionId: execution.id,
      status: this.determineStatus(jobs),
      outputs,
      rootUrl: rootJob?.result?.url,
      createdAt: execution.createdAt,
      completedAt: new Date(),
    };
  }

  private determineStatus(jobs: any[]): string {
    const allCompleted = jobs.every((j) => j.status === "completed");
    const anyFailed = jobs.some((j) => j.status === "failed");

    if (anyFailed) return "failed";
    if (allCompleted) return "completed";
    return "partial";
  }

  private generateSignature(payload: any, secret?: string): string | null {
    if (!secret) return null;

    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest("hex");
  }

  private async deliverWebhook(
    url: string,
    payload: any,
    signature: string | null,
  ): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "OpenVideo-Webhook/1.0",
    };

    if (signature) {
      headers["X-Webhook-Signature"] = signature;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook delivery failed: ${response.status} ${response.statusText}`,
      );
    }
  }

  private async markExecutionComplete(executionId: string, data: any) {
    const status = this.determineStatus(data.jobs);
    const rootJob = data.jobs.find(
      (j: any) => !j.dependencies || j.dependencies.length === 0,
    );

    await db
      .update(executions)
      .set({
        status,
        result: rootJob?.result,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(executions.id, executionId));
  }
}
```

## Retry Configuration

Update job registration with retry settings:

```typescript
jobManager.registerJob("pipeline:webhook-delivery", WebhookDeliveryJob, {
  retryLimit: 3,
  retryDelay: 60, // seconds
  retryBackoff: true,
  expireInHours: 24,
});
```

## Webhook Payload Format

```typescript
{
  executionId: string;
  status: 'completed' | 'failed' | 'partial';
  outputs: {
    [jobId: string]: {
      url: string;
      operation: string;
    }
  };
  rootUrl: string; // Final output URL
  createdAt: string;
  completedAt: string;
}
```

## Signature Verification (Client Side)

```typescript
function verifyWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
```

## Testing

```bash
# Setup webhook receiver
npx webhook-relay forward 3000

# Trigger execution with webhook
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "executionPlan": {...},
    "options": {
      "webhookUrl": "https://webhook.site/your-id",
      "webhookSecret": "test-secret"
    }
  }'
```

## Completion Criteria

- [ ] Webhook job handler complete
- [ ] HMAC signature generation works
- [ ] Retry logic configured
- [ ] Marks execution as complete
- [ ] Job registered with retry settings
