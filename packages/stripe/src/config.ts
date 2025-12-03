import Stripe from "stripe";

// Stripe client singleton
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

// Plan configuration
export const PLANS = {
  free: {
    name: "Free",
    monthlyActionLimit: 2000,
    priceInCents: 0,
    overageAllowed: false,
    overagePricePerThousand: 0,
  },
  pro: {
    name: "Pro",
    monthlyActionLimit: 10000,
    priceInCents: 5000, // $50
    overageAllowed: true,
    overagePricePerThousand: 500, // $5 per 1000 actions
  },
} as const;

// Stripe Price ID for Pro plan (set in environment)
export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_PRO_PRICE_ID environment variable is not set");
  }
  return priceId;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }
  return secret;
}

export function getSuccessUrl(): string {
  return process.env.STRIPE_SUCCESS_URL!;
}

export function getCancelUrl(): string {
  return process.env.STRIPE_CANCEL_URL!;
}
