ALTER TABLE "executions" ADD COLUMN "webhook_delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "executions" ADD COLUMN "webhook_delivery_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "executions" ADD COLUMN "webhook_delivery_error" text;