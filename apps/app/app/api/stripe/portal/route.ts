import { auth } from "@clerk/nextjs/server";
import { createBillingPortalSession } from "@repo/stripe";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get the base URL for the application.
 * Uses NEXT_PUBLIC_APP_URL if set, otherwise constructs from request headers.
 */
async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback: construct from headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session for managing subscription.
 * User can cancel, update payment method, view invoices, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Organization required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const baseUrl = await getBaseUrl();
    const returnUrl = body.returnUrl || `${baseUrl}/overview`;

    const portalUrl = await createBillingPortalSession(orgId, returnUrl);

    return NextResponse.json({
      success: true,
      portalUrl,
    });
  } catch (error) {
    console.error("[Stripe Portal] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create portal session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
