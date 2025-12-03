import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOverageStatus } from "@repo/stripe";

/**
 * GET /api/stripe/usage
 *
 * Get current usage and overage status for the organization.
 */
export async function GET() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Organization required" },
        { status: 401 },
      );
    }

    const usage = await getOverageStatus(orgId);

    return NextResponse.json({
      success: true,
      planType: usage.planType,
      periodStart: usage.periodStart.toISOString(),
      periodEnd: usage.periodEnd.toISOString(),
      includedActions: usage.monthlyLimit,
      actionsUsed: usage.actionsUsed,
      overageActions: usage.overageActions,
      overageCost: usage.estimatedOverageCharge / 100,
    });
  } catch (error) {
    console.error("[Stripe Usage] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to get usage data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
