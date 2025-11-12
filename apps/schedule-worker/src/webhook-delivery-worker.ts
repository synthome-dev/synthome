import { processWebhookDeliveries } from "@repo/db";

interface WebhookDeliveryWorkerConfig {
  intervalMs?: number; // How often to check for pending webhooks (default: 30 seconds)
}

export class WebhookDeliveryWorker {
  private intervalMs: number;
  private intervalHandle: Timer | null = null;
  private isRunning = false;

  constructor(config: WebhookDeliveryWorkerConfig = {}) {
    this.intervalMs = config.intervalMs || 30000; // Default: 30 seconds
  }

  async start() {
    if (this.isRunning) {
      console.log("[WebhookDeliveryWorker] Already running");
      return;
    }

    this.isRunning = true;
    console.log(
      `[WebhookDeliveryWorker] Starting... (checking every ${this.intervalMs / 1000}s)`,
    );

    // Run immediately on start
    await this.checkAndDeliverWebhooks();

    // Then run at intervals
    this.intervalHandle = setInterval(() => {
      this.checkAndDeliverWebhooks();
    }, this.intervalMs);
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    console.log("[WebhookDeliveryWorker] Stopped");
  }

  private async checkAndDeliverWebhooks() {
    if (!this.isRunning) {
      return;
    }

    try {
      const result = await processWebhookDeliveries();

      if (result.delivered > 0 || result.failed > 0) {
        console.log(
          `[WebhookDeliveryWorker] Delivered: ${result.delivered}, Failed: ${result.failed}`,
        );

        if (result.errors.length > 0) {
          console.error(
            "[WebhookDeliveryWorker] Errors:",
            result.errors.slice(0, 5),
          ); // Show first 5 errors
        }
      }
    } catch (error) {
      console.error(
        "[WebhookDeliveryWorker] Error processing webhooks:",
        error,
      );
    }
  }
}
