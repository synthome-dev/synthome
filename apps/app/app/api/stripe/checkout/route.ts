import { auth, currentUser } from "@clerk/nextjs/server";
import { createCheckoutSession } from "@repo/stripe";
import { NextResponse } from "next/server";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for upgrading to Pro plan.
 * Requires Clerk authentication.
 */
export async function POST() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Organization required" },
        { status: 401 }
      );
    }

    // Get user email from Clerk
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const name = user?.fullName || user?.firstName || undefined;

    const result = await createCheckoutSession(orgId, email, name);

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);

    if (error instanceof Error && error.message.includes("already on Pro")) {
      return NextResponse.json(
        { error: "Already on Pro plan" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
