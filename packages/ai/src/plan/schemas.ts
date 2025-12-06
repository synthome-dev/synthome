import { z } from "zod";

/**
 * Operation types supported by Synthome
 */
export const operationTypeSchema = z.enum([
  "generate",
  "generateImage",
  "generateAudio",
  "transcribe",
  "merge",
  "reframe",
  "lipSync",
  "addSubtitles",
  "removeBackground",
  "removeImageBackground",
  "layer",
]);

export type OperationType = z.infer<typeof operationTypeSchema>;

/**
 * A single job node in the execution plan
 */
export const jobNodeSchema = z.object({
  /**
   * Unique identifier for this job
   */
  id: z.string().describe("Unique identifier for this job"),

  /**
   * The type of operation to perform
   */
  type: operationTypeSchema.describe("The type of operation to perform"),

  /**
   * Parameters for the operation
   */
  params: z.record(z.unknown()).describe("Parameters for the operation"),

  /**
   * Array of job IDs that must complete before this job runs
   */
  dependsOn: z
    .array(z.string())
    .optional()
    .describe("Array of job IDs that must complete before this job runs"),

  /**
   * Output reference for this job (e.g., "$job1")
   */
  output: z.string().describe('Output reference for this job (e.g., "$job1")'),
});

export type JobNode = z.infer<typeof jobNodeSchema>;

/**
 * The complete execution plan containing all jobs
 */
export const executionPlanSchema = z.object({
  /**
   * Array of jobs to execute
   */
  jobs: z
    .array(jobNodeSchema)
    .min(1)
    .describe("Array of jobs to execute in the workflow"),

  /**
   * Optional reference to a parent execution for chaining
   */
  baseExecutionId: z
    .string()
    .optional()
    .describe("Optional reference to a parent execution for chaining"),
});

export type ExecutionPlan = z.infer<typeof executionPlanSchema>;
