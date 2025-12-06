import { executeFromPlan } from "@synthome/sdk";
import type { ExecuteOptions, PipelineExecution } from "@synthome/sdk";
import { executionPlanSchema, type ExecutionPlan } from "./schemas.ts";

/**
 * Options for executePlanTool
 */
export interface ExecutePlanToolOptions {
  /**
   * Synthome API key for authentication
   */
  apiKey?: string;

  /**
   * Custom API URL (defaults to Synthome API)
   */
  apiUrl?: string;

  /**
   * Webhook URL for async execution.
   * If provided, the tool returns immediately with an execution ID.
   * If not provided, the tool waits for completion.
   */
  webhook?: string;

  /**
   * Secret for webhook HMAC signature verification
   */
  webhookSecret?: string;

  /**
   * Provider API keys for direct provider access
   */
  providerApiKeys?: {
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
    elevenlabs?: string;
    hume?: string;
  };
}

/**
 * Result from executePlanTool
 */
export interface ExecutePlanResult {
  executionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    url: string;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * Result from buildPlanTool
 */
export interface BuildPlanResult {
  plan: ExecutionPlan;
}

/**
 * AI SDK compatible tool definition
 */
export interface ToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: typeof executionPlanSchema;
  execute: (input: TInput) => Promise<TOutput>;
}

/**
 * Creates an AI SDK tool that generates and executes media workflows.
 *
 * @example
 * ```typescript
 * import { executePlanTool, planSystemPrompt } from '@synthome/ai';
 * import { generateText } from 'ai';
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   system: planSystemPrompt,
 *   tools: {
 *     executePlan: executePlanTool({
 *       apiKey: process.env.SYNTHOME_API_KEY,
 *     }),
 *   },
 *   prompt: 'Create a video of a sunset',
 * });
 * ```
 */
export function executePlanTool(
  options: ExecutePlanToolOptions = {},
): ToolDefinition<ExecutionPlan, ExecutePlanResult> {
  const executeOptions: ExecuteOptions = {
    apiKey: options.apiKey,
    apiUrl: options.apiUrl,
    webhook: options.webhook,
    webhookSecret: options.webhookSecret,
    providerApiKeys: options.providerApiKeys,
  };

  return {
    name: "execute_plan",
    description:
      "Generate and execute a media workflow to create images, videos, or audio. Returns the result URL when complete.",
    inputSchema: executionPlanSchema,
    execute: async (plan: ExecutionPlan): Promise<ExecutePlanResult> => {
      const execution: PipelineExecution = await executeFromPlan(
        plan,
        executeOptions,
      );

      return {
        executionId: execution.id,
        status: execution.status,
        result: execution.result as ExecutePlanResult["result"],
        error: undefined,
      };
    },
  };
}

/**
 * Creates an AI SDK tool that generates media workflow plans without executing them.
 *
 * Use this when you want to:
 * - Design workflows for later execution
 * - Save workflow templates to a database
 * - Review/modify plans before running
 *
 * @example
 * ```typescript
 * import { buildPlanTool, planSystemPrompt } from '@synthome/ai';
 * import { generateText } from 'ai';
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   system: planSystemPrompt,
 *   tools: {
 *     buildPlan: buildPlanTool(),
 *   },
 *   prompt: 'Design a workflow for creating a product video',
 * });
 *
 * // Save the plan for later
 * const plan = result.toolResults[0].result.plan;
 * await db.savePlan('product-video', plan);
 *
 * // Execute later
 * import { executeFromPlan } from '@synthome/sdk';
 * const execution = await executeFromPlan(plan);
 * ```
 */
export function buildPlanTool(): ToolDefinition<
  ExecutionPlan,
  BuildPlanResult
> {
  return {
    name: "build_plan",
    description:
      "Build a media workflow plan (JSON) without executing it. Use this when the user wants to design, save, or review a workflow for later execution.",
    inputSchema: executionPlanSchema,
    execute: async (plan: ExecutionPlan): Promise<BuildPlanResult> => {
      // The schema validation happens automatically via Zod
      // Just return the validated plan
      return { plan };
    },
  };
}
