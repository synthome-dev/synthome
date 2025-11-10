import { Hono } from "hono";
import { db, usageLimits } from "@repo/db";
import { apiKeyService } from "@repo/api-keys";
import {
  getCurrentUsage,
  getCurrentPeriodStats,
  getUsageHistory,
  getUsageByActionType,
} from "@repo/db";

const adminRouter = new Hono();

/**
 * POST /api/admin/setup-org
 *
 * Create a test organization with API keys and usage limits.
 *
 * Body:
 * {
 *   "organizationId": "org_2abc123def",
 *   "planType": "free" | "pro" | "custom"
 * }
 */
adminRouter.post("/setup-org", async (c) => {
  try {
    const { organizationId, planType = "free" } = await c.req.json();

    if (!organizationId) {
      return c.json({ error: "organizationId is required" }, 400);
    }

    if (!["free", "pro", "custom"].includes(planType)) {
      return c.json({ error: "planType must be free, pro, or custom" }, 400);
    }

    // Plan configuration
    const planConfig = {
      free: {
        monthlyActionLimit: 2000,
        isUnlimited: false,
        overageAllowed: false,
        overagePricePerAction: null,
      },
      pro: {
        monthlyActionLimit: 10000,
        isUnlimited: false,
        overageAllowed: true,
        overagePricePerAction: "0.0010",
      },
      custom: {
        monthlyActionLimit: 50000,
        isUnlimited: true,
        overageAllowed: false,
        overagePricePerAction: null,
      },
    };

    const config = planConfig[planType as keyof typeof planConfig];

    // Check if organization already exists
    const existingLimits = await db.query.usageLimits.findFirst({
      where: (limits, { eq }) => eq(limits.organizationId, organizationId),
    });

    let limitsCreated = false;

    if (!existingLimits) {
      // Create usage limits
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      await db.insert(usageLimits).values({
        id: `ul_${organizationId}`,
        organizationId,
        planType: planType as "free" | "pro" | "custom",
        monthlyActionLimit: config.monthlyActionLimit,
        isUnlimited: config.isUnlimited,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        actionsUsedThisPeriod: 0,
        overageAllowed: config.overageAllowed,
        overagePricePerAction: config.overagePricePerAction,
        overageActionsThisPeriod: 0,
      });

      limitsCreated = true;
    }

    // Generate API keys
    const testKey = await apiKeyService.generateApiKey(
      organizationId,
      "test",
      "Test API Key",
    );

    const prodKey = await apiKeyService.generateApiKey(
      organizationId,
      "production",
      "Production API Key",
    );

    return c.json({
      success: true,
      organizationId,
      planType,
      limitsCreated,
      limits: config,
      apiKeys: {
        test: {
          key: testKey.apiKey,
          prefix: testKey.prefix,
          id: testKey.id,
        },
        production: {
          key: prodKey.apiKey,
          prefix: prodKey.prefix,
          id: prodKey.id,
        },
      },
      exampleCurl: `curl -X POST http://localhost:3100/api/execute \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${testKey.apiKey}" \\
  -d '{
    "executionPlan": {
      "jobs": [
        {
          "id": "generate-1",
          "operation": "generate-video",
          "params": {
            "prompt": "A serene lake at sunset",
            "modelId": "fal/fast-svd"
          }
        }
      ]
    }
  }'`,
    });
  } catch (error) {
    console.error("[AdminRouter] Error setting up organization:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * GET /api/admin/usage/:organizationId
 *
 * Get usage statistics for an organization.
 */
adminRouter.get("/usage/:organizationId", async (c) => {
  try {
    const organizationId = c.req.param("organizationId");

    // Get current usage limits
    const limits = await getCurrentUsage(organizationId);

    if (!limits) {
      return c.json(
        {
          error: "Organization not found",
          message:
            "No usage limits found. Use POST /api/admin/setup-org to create.",
        },
        404,
      );
    }

    // Get current period stats
    const stats = await getCurrentPeriodStats(organizationId);

    // Get usage by action type
    const byActionType = await getUsageByActionType(
      organizationId,
      limits.currentPeriodStart,
      limits.currentPeriodEnd,
    );

    // Get recent history
    const history = await getUsageHistory({
      organizationId,
      limit: 10,
    });

    // Calculate days remaining
    const now = new Date();
    const daysLeft = Math.ceil(
      (limits.currentPeriodEnd.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return c.json({
      organizationId,
      plan: {
        type: limits.planType,
        monthlyLimit: limits.isUnlimited
          ? "unlimited"
          : limits.monthlyActionLimit,
        overageAllowed: limits.overageAllowed,
        overagePricePerAction: limits.overagePricePerAction,
      },
      billingPeriod: {
        start: limits.currentPeriodStart,
        end: limits.currentPeriodEnd,
        daysRemaining: daysLeft,
      },
      usage: stats
        ? {
            totalActions: stats.totalActions,
            regularActions: stats.regularActions,
            overageActions: stats.overageActions,
            percentUsed: parseFloat(stats.percentUsed.toFixed(2)),
            estimatedCost: stats.totalCost,
          }
        : null,
      byActionType,
      recentActivity: history.map((log) => ({
        actionType: log.actionType,
        actionCount: log.actionCount,
        isOverage: log.isOverage,
        estimatedCost: log.estimatedCost,
        executionId: log.executionId,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("[AdminRouter] Error fetching usage:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * GET /api/admin/list-keys/:organizationId
 *
 * List all API keys for an organization.
 */
adminRouter.get("/list-keys/:organizationId", async (c) => {
  try {
    const organizationId = c.req.param("organizationId");

    const keys = await apiKeyService.listApiKeys(organizationId);

    return c.json({
      organizationId,
      keys: keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.keyPrefix,
        environment: key.environment,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        revokedAt: key.revokedAt,
      })),
    });
  } catch (error) {
    console.error("[AdminRouter] Error listing keys:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

/**
 * POST /api/admin/revoke-key
 *
 * Revoke an API key.
 *
 * Body:
 * {
 *   "keyId": "key_id_here"
 * }
 */
adminRouter.post("/revoke-key", async (c) => {
  try {
    const { keyId } = await c.req.json();

    if (!keyId) {
      return c.json({ error: "keyId is required" }, 400);
    }

    await apiKeyService.revokeApiKey(keyId);

    return c.json({
      success: true,
      message: "API key revoked successfully",
      keyId,
    });
  } catch (error) {
    console.error("[AdminRouter] Error revoking key:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

export { adminRouter };
