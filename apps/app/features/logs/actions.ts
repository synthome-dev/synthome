"use server";

import { auth } from "@clerk/nextjs/server";
import { db, executions, executionJobs, desc, eq, sql } from "@repo/db";
import { Execution } from "./types";

export async function getExecutions(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: {
    executions: Execution[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}> {
  const { orgId } = await auth();

  if (!orgId) {
    return {
      success: false,
      error: "No organization found. Please select an organization.",
    };
  }

  try {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    // Fetch executions with their jobs (jobs ordered oldest to newest)
    const result = await db.query.executions.findMany({
      where: eq(executions.organizationId, orgId),
      orderBy: [desc(executions.createdAt)],
      limit: limit,
      offset: offset,
      with: {
        jobs: {
          orderBy: [executionJobs.createdAt], // Ascending order - oldest first
        },
      },
    });

    // Get total count for pagination using count function
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(executions)
      .where(eq(executions.organizationId, orgId));

    const total = Number(countResult?.count || 0);

    return {
      success: true,
      data: {
        executions: result as unknown as Execution[],
        total,
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching executions:", error);
    return {
      success: false,
      error: "Failed to fetch executions. Please try again.",
    };
  }
}

export async function getRecentExecutions(limit: number = 10): Promise<{
  success: boolean;
  data?: Execution[];
  error?: string;
}> {
  const { orgId } = await auth();

  if (!orgId) {
    return {
      success: false,
      error: "No organization found. Please select an organization.",
    };
  }

  try {
    const result = await db.query.executions.findMany({
      where: eq(executions.organizationId, orgId),
      orderBy: [desc(executions.createdAt)],
      limit: limit,
      with: {
        jobs: {
          orderBy: [desc(executionJobs.createdAt)],
        },
      },
    });

    return {
      success: true,
      data: result as unknown as Execution[],
    };
  } catch (error) {
    console.error("Error fetching recent executions:", error);
    return {
      success: false,
      error: "Failed to fetch recent executions. Please try again.",
    };
  }
}
