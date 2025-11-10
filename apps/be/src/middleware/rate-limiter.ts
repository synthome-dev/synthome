import { checkUsageAllowed } from "@repo/db";
import { Context, Next } from "hono";
import { getAuthContext } from "./auth";

/**
 * Middleware to check if organization has remaining usage allowance.
 * Must be used after authMiddleware.
 *
 * Blocks requests if:
 * - Free plan has reached monthly limit (hard block)
 * - Pro plan has reached limit and overage is not allowed
 *
 * Allows through if:
 * - Within monthly limit
 * - Pro plan with overage allowed (will be charged)
 * - Custom/unlimited plan
 */
export async function rateLimitMiddleware(c: Context, next: Next) {
  const auth = getAuthContext(c);

  try {
    const usageCheck = await checkUsageAllowed(auth.organizationId);

    if (!usageCheck.allowed) {
      return c.json(
        {
          error: "Rate Limit Exceeded",
          message:
            usageCheck.reason || "You have exceeded your monthly action limit",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429
      );
    }

    // Attach overage status to context for usage logging
    c.set("isOverage", usageCheck.isOverage);

    await next();
  } catch (error) {
    console.error("[RateLimitMiddleware] Error checking usage:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to check usage limits",
      },
      500
    );
  }
}

/**
 * Helper to check if current request is overage.
 * Must be used after rateLimitMiddleware.
 */
export function isOverage(c: Context): boolean {
  return c.get("isOverage") === true;
}
