import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncStripeDataByOrg } from "@repo/stripe";

/**
 * POST /api/stripe/sync
 *
 * Manually sync Stripe data for an organization.
 * Called after checkout success redirect.
 */
export async function POST() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Organization required" },
        { status: 401 },
      );
    }

    const subscriptionData = await syncStripeDataByOrg(orgId);

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error("[Stripe Sync] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync subscription data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
