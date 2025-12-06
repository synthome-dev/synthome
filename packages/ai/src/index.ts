/**
 * @synthome/ai - AI SDK tools for Synthome media workflows
 *
 * This package provides AI SDK compatible tools for generating and executing
 * media workflows using Synthome.
 *
 * @example
 * ```typescript
 * import { executePlanTool, planSystemPrompt } from '@synthome/ai';
 * import { generateText } from 'ai';
 * import { openai } from '@ai-sdk/openai';
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   system: planSystemPrompt,
 *   tools: {
 *     executePlan: executePlanTool({
 *       apiKey: process.env.SYNTHOME_API_KEY,
 *     }),
 *   },
 *   prompt: 'Create a video of a sunset over mountains',
 * });
 * ```
 */

// Plan tools
export {
  // Tools
  executePlanTool,
  buildPlanTool,
  // Schemas
  executionPlanSchema,
  jobNodeSchema,
  operationTypeSchema,
  // Prompt
  planSystemPrompt,
} from "./plan/index.ts";

// Types
export type {
  ExecutePlanToolOptions,
  ExecutePlanResult,
  BuildPlanResult,
  ToolDefinition,
  ExecutionPlan,
  JobNode,
  OperationType,
} from "./plan/index.ts";
