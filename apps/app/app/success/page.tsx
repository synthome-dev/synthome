import { auth } from "@clerk/nextjs/server";
import { syncStripeDataByOrg } from "@repo/stripe";
import { redirect } from "next/navigation";

/**
 * Success page after Stripe checkout.
 * Following T3 pattern: sync Stripe data before redirecting.
 *
 * This prevents race conditions where user returns before webhook fires.
 */
export default async function SuccessPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/sign-in");
  }

  // Sync Stripe data immediately to prevent race conditions
  // This ensures the user sees their updated plan status
  try {
    await syncStripeDataByOrg(orgId);
    console.log(`[Success] Synced Stripe data for org ${orgId}`);
  } catch (error) {
    console.error(
      `[Success] Error syncing Stripe data for org ${orgId}:`,
      error
    );
    // Continue anyway - the webhook will eventually sync the data
  }

  // Redirect to billing/api-keys page where they can see their updated plan
  redirect("/overview?upgraded=true");
}
