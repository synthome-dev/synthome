CREATE TABLE "action_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"api_key_id" text NOT NULL,
	"execution_id" text,
	"job_id" text,
	"action_type" text NOT NULL,
	"action_count" integer DEFAULT 1 NOT NULL,
	"is_overage" boolean DEFAULT false NOT NULL,
	"estimated_cost" numeric(10, 4),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_encrypted" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"environment" text NOT NULL,
	"last_used_at" timestamp,
	"last_used_ip" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "execution_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"execution_id" text NOT NULL,
	"job_id" text NOT NULL,
	"pgboss_job_id" text,
	"status" text NOT NULL,
	"operation" text NOT NULL,
	"dependencies" jsonb,
	"progress" jsonb,
	"metadata" jsonb,
	"result" jsonb,
	"error" text,
	"provider_job_id" text,
	"provider_job_status" text,
	"waiting_strategy" text,
	"next_poll_at" timestamp,
	"poll_attempts" integer DEFAULT 0,
	"organization_id" text,
	"action_logged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"execution_plan" jsonb NOT NULL,
	"base_execution_id" text,
	"webhook_url" text,
	"webhook_secret" text,
	"result" jsonb,
	"error" text,
	"organization_id" text,
	"api_key_id" text,
	"actions_counted" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"plan_type" text NOT NULL,
	"monthly_action_limit" integer NOT NULL,
	"is_unlimited" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"actions_used_this_period" integer DEFAULT 0 NOT NULL,
	"overage_allowed" boolean DEFAULT false NOT NULL,
	"overage_price_per_action" numeric(10, 4),
	"overage_actions_this_period" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usage_limits_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_job_id_execution_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."execution_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_jobs" ADD CONSTRAINT "execution_jobs_execution_id_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."executions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;