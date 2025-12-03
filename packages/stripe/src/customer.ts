import { db, usageLimits, eq } from "@repo/db";
import { getStripe } from "./config";

/**
 * Create a Stripe customer for an organization.
 * Should be called when a new organization is created via Clerk webhook.
 */
export async function createStripeCustomer(
  organizationId: string,
  email?: string,
  name?: string,
): Promise<string> {
  const stripe = getStripe();

  // Check if customer already exists
  const existing = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
    columns: { stripeCustomerId: true },
  });

  if (existing?.stripeCustomerId) {
    console.log(
      `[Stripe] Customer already exists for org ${organizationId}: ${existing.stripeCustomerId}`,
    );
    return existing.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId, // Critical: links Stripe customer to our org
    },
  });

  // Update the usage limits record with the Stripe customer ID
  await db
    .update(usageLimits)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(usageLimits.organizationId, organizationId));

  console.log(
    `[Stripe] Created customer ${customer.id} for org ${organizationId}`,
  );

  return customer.id;
}

/**
 * Get the Stripe customer ID for an organization.
 */
export async function getStripeCustomerId(
  organizationId: string,
): Promise<string | null> {
  const result = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.organizationId, organizationId),
    columns: { stripeCustomerId: true },
  });

  return result?.stripeCustomerId ?? null;
}

/**
 * Get organization ID from Stripe customer ID.
 */
export async function getOrganizationByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const result = await db.query.usageLimits.findFirst({
    where: eq(usageLimits.stripeCustomerId, stripeCustomerId),
    columns: { organizationId: true },
  });

  return result?.organizationId ?? null;
}
