import { auth } from "@clerk/nextjs/server";
import {
  db,
  executions,
  executionJobs,
  desc,
  eq,
  sql,
  and,
  or,
} from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { inArray, gt } from "drizzle-orm";

// Active statuses that may still change
const ACTIVE_STATUSES = ["pending", "in_progress", "waiting"];

export async function GET(request: NextRequest) {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json(
      {
        success: false,
        error: "No organization found. Please select an organization.",
      },
      { status: 401 },
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const activeOnly = searchParams.get("activeOnly") === "true";
    const since = searchParams.get("since"); // ISO timestamp
    // IDs of executions client considers "active" - we should refetch these
    const watchIdsParam = searchParams.get("watchIds");
    const watchIds = watchIdsParam
      ? watchIdsParam.split(",").filter(Boolean)
      : [];

    // Get total count for pagination (always need this)
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(executions)
      .where(eq(executions.organizationId, orgId));

    const total = Number(countResult?.count || 0);

    if (activeOnly) {
      // Optimized polling mode: only fetch active executions + watched ones + new ones
      // First, get the execution IDs for the current page to know which ones to check
      const pageExecutionIds = await db
        .select({ id: executions.id })
        .from(executions)
        .where(eq(executions.organizationId, orgId))
        .orderBy(desc(executions.createdAt))
        .limit(limit)
        .offset(offset);

      const ids = pageExecutionIds.map((e) => e.id);

      if (ids.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            executions: [],
            total,
            page,
            limit,
            activeOnly: true,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Build conditions for fetching executions:
      // 1. Executions on this page that have active status
      // 2. Executions that the client is watching (were active, might have completed)
      // 3. New executions created since the last fetch (if `since` provided)
      const conditions: ReturnType<typeof and>[] = [];

      // Active executions on this page
      conditions.push(
        and(
          inArray(executions.id, ids),
          inArray(executions.status, ACTIVE_STATUSES),
        ),
      );

      // Watched executions (client's previously active executions)
      if (watchIds.length > 0) {
        // Only watch IDs that are on this page
        const watchIdsOnPage = watchIds.filter((id) => ids.includes(id));
        if (watchIdsOnPage.length > 0) {
          conditions.push(inArray(executions.id, watchIdsOnPage));
        }
      }

      // New executions since timestamp
      if (since) {
        const sinceDate = new Date(since);
        conditions.push(
          and(
            eq(executions.organizationId, orgId),
            gt(executions.createdAt, sinceDate),
          ),
        );
      }

      // Fetch executions matching any condition
      const result = await db.query.executions.findMany({
        where: or(...conditions),
        orderBy: [desc(executions.createdAt)],
        with: {
          jobs: {
            orderBy: [executionJobs.createdAt],
          },
        },
      });

      // Also fetch executions that have active jobs (even if execution status is not active)
      const executionsWithActiveJobs = await db
        .selectDistinct({ id: executions.id })
        .from(executions)
        .innerJoin(executionJobs, eq(executions.id, executionJobs.executionId))
        .where(
          and(
            inArray(executions.id, ids),
            inArray(executionJobs.status, ACTIVE_STATUSES),
          ),
        );

      const activeJobExecutionIds = executionsWithActiveJobs.map((e) => e.id);
      const alreadyFetchedIds = new Set(result.map((e) => e.id));

      // Fetch any missing executions that have active jobs
      const missingIds = activeJobExecutionIds.filter(
        (id) => !alreadyFetchedIds.has(id),
      );

      if (missingIds.length > 0) {
        const additionalExecutions = await db.query.executions.findMany({
          where: inArray(executions.id, missingIds),
          orderBy: [desc(executions.createdAt)],
          with: {
            jobs: {
              orderBy: [executionJobs.createdAt],
            },
          },
        });
        result.push(...additionalExecutions);
      }

      return NextResponse.json({
        success: true,
        data: {
          executions: result,
          total,
          page,
          limit,
          activeOnly: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Full fetch mode (initial load)
    const result = await db.query.executions.findMany({
      where: eq(executions.organizationId, orgId),
      orderBy: [desc(executions.createdAt)],
      limit: limit,
      offset: offset,
      with: {
        jobs: {
          orderBy: [executionJobs.createdAt],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        executions: result,
        total,
        page,
        limit,
        activeOnly: false,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching executions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch executions. Please try again.",
      },
      { status: 500 },
    );
  }
}
