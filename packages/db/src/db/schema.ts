import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// API Keys table - secure key storage
// organizationId references Clerk organization ID
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(), // Clerk org ID

  keyHash: text("key_hash").notNull().unique(),
  keyEncrypted: text("key_encrypted").notNull(), // AES-256 encrypted key
  keyPrefix: text("key_prefix").notNull(), // 'sy_live_' or 'sy_test_'

  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  environment: text("environment").notNull().$type<"test" | "production">(),

  // Security tracking
  lastUsedAt: timestamp("last_used_at"),
  lastUsedIp: text("last_used_ip"),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

// Usage Limits table - plan limits and current usage
// organizationId references Clerk organization ID
export const usageLimits = pgTable("usage_limits", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().unique(), // Clerk org ID

  planType: text("plan_type").notNull().$type<"free" | "pro" | "custom">(),

  // Limits
  monthlyActionLimit: integer("monthly_action_limit").notNull(),
  isUnlimited: boolean("is_unlimited").notNull().default(false),

  // Current period tracking
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  actionsUsedThisPeriod: integer("actions_used_this_period")
    .notNull()
    .default(0),

  // Pro plan overage
  overageAllowed: boolean("overage_allowed").notNull().default(false),
  overagePricePerAction: decimal("overage_price_per_action", {
    precision: 10,
    scale: 4,
  }),
  overageActionsThisPeriod: integer("overage_actions_this_period")
    .notNull()
    .default(0),

  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").$type<
    | "active"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "paused"
    | "trialing"
    | "unpaid"
    | "none"
  >(),
  stripePriceId: text("stripe_price_id"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  // Overage from previous billing period (in cents), to be added to next invoice
  pendingOverageAmount: integer("pending_overage_amount").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Provider API Keys table - stores user's provider keys (Replicate, FAL, Google Cloud, Hume, ElevenLabs)
export const providerApiKeys = pgTable("provider_api_keys", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(), // Clerk org ID

  // Provider identification - one record per provider per org
  provider: text("provider")
    .notNull()
    .$type<"replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs">(),

  // Encrypted API key (nullable - empty until user adds key)
  keyEncrypted: text("key_encrypted"), // AES-256 encrypted, null until set
  keyPrefix: text("key_prefix"), // 'r8_', 'fal_', etc. for display

  isActive: boolean("is_active").notNull().default(true),

  // Tracking
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Storage Integrations table - stores user's S3-compatible storage configuration
// One record per organization
export const storageIntegrations = pgTable("storage_integrations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().unique(), // Clerk org ID

  // S3 credentials (encrypted)
  accessKeyEncrypted: text("access_key_encrypted"), // AES-256 encrypted, null until set
  secretKeyEncrypted: text("secret_key_encrypted"), // AES-256 encrypted, null until set

  // S3 configuration
  endpoint: text("endpoint"), // S3 endpoint URL (e.g., https://s3.amazonaws.com)
  region: text("region"), // AWS region (e.g., us-east-1)
  bucket: text("bucket"), // Bucket name
  cdnUrl: text("cdn_url"), // Optional CDN URL for public file access

  isActive: boolean("is_active").notNull().default(true),

  // Tracking
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Action Logs table - detailed usage tracking
export const actionLogs = pgTable("action_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(), // Clerk org ID
  apiKeyId: text("api_key_id")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),

  // Execution context
  executionId: text("execution_id").references(() => executions.id, {
    onDelete: "set null",
  }),
  jobId: text("job_id").references(() => executionJobs.id, {
    onDelete: "set null",
  }),

  // Action details
  actionType: text("action_type").notNull(), // 'generate-video', 'merge-videos', etc.
  actionCount: integer("action_count").notNull().default(1),

  // Billing context
  isOverage: boolean("is_overage").notNull().default(false),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }),

  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const executions = pgTable("executions", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  executionPlan: jsonb("execution_plan").notNull(),
  baseExecutionId: text("base_execution_id"),
  webhook: text("webhook"),
  webhookSecret: text("webhook_secret"),
  result: jsonb("result"),
  error: text("error"),

  // Provider API keys - client-provided keys for Replicate, FAL, etc.
  providerApiKeys: jsonb("provider_api_keys").$type<{
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
    hume?: string;
    elevenlabs?: string;
  }>(),

  // Billing integration - Clerk org ID
  organizationId: text("organization_id"),
  apiKeyId: text("api_key_id").references(() => apiKeys.id),
  actionsCounted: integer("actions_counted").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),

  // Webhook delivery tracking
  webhookDeliveredAt: timestamp("webhook_delivered_at"),
  webhookDeliveryAttempts: integer("webhook_delivery_attempts").default(0),
  webhookDeliveryError: text("webhook_delivery_error"),
});

export const executionJobs = pgTable("execution_jobs", {
  id: text("id").primaryKey(),
  executionId: text("execution_id")
    .notNull()
    .references(() => executions.id),
  jobId: text("job_id").notNull(),
  pgBossJobId: text("pgboss_job_id"),
  status: text("status").notNull(),
  operation: text("operation").notNull(),
  dependencies: jsonb("dependencies").$type<string[]>(),
  progress: jsonb("progress").$type<{ stage?: string; percentage?: number }>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  result: jsonb("result"),
  error: text("error"),

  // Async provider job tracking
  providerJobId: text("provider_job_id"),
  providerJobStatus: text("provider_job_status"),
  waitingStrategy: text("waiting_strategy").$type<"webhook" | "polling">(),
  nextPollAt: timestamp("next_poll_at"),
  pollAttempts: integer("poll_attempts").default(0),

  // Billing integration - Clerk org ID
  organizationId: text("organization_id"),
  actionLogged: boolean("action_logged").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// ===== Relations =====

export const apiKeysRelations = relations(apiKeys, ({ many }) => ({
  actionLogs: many(actionLogs),
  executions: many(executions),
}));

export const usageLimitsRelations = relations(usageLimits, ({}) => ({}));

export const providerApiKeysRelations = relations(
  providerApiKeys,
  ({}) => ({}),
);

export const storageIntegrationsRelations = relations(
  storageIntegrations,
  ({}) => ({}),
);

export const actionLogsRelations = relations(actionLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [actionLogs.apiKeyId],
    references: [apiKeys.id],
  }),
  execution: one(executions, {
    fields: [actionLogs.executionId],
    references: [executions.id],
  }),
  job: one(executionJobs, {
    fields: [actionLogs.jobId],
    references: [executionJobs.id],
  }),
}));

export const executionsRelations = relations(executions, ({ one, many }) => ({
  apiKey: one(apiKeys, {
    fields: [executions.apiKeyId],
    references: [apiKeys.id],
  }),
  jobs: many(executionJobs),
  actionLogs: many(actionLogs),
}));

export const executionJobsRelations = relations(
  executionJobs,
  ({ one, many }) => ({
    execution: one(executions, {
      fields: [executionJobs.executionId],
      references: [executions.id],
    }),
    actionLogs: many(actionLogs),
  }),
);
