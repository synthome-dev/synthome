import { Context, Next } from "hono";
import { apiKeyService } from "@repo/api-keys";

export interface AuthContext {
  organizationId: string;
  apiKeyId: string;
  environment: "test" | "production";
}

/**
 * Middleware to validate API keys and attach auth context to request.
 * Expects API key in Authorization header: "Bearer sy_live_xxx" or "Bearer sy_test_xxx"
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
      },
      401,
    );
  }

  const apiKey = authHeader.replace("Bearer ", "");

  try {
    const validatedKey = await apiKeyService.validateApiKey(apiKey);

    if (!validatedKey) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid or inactive API key",
        },
        401,
      );
    }

    // Attach auth context to request
    c.set("auth", {
      organizationId: validatedKey.organizationId,
      apiKeyId: validatedKey.id,
      environment: validatedKey.environment,
    } as AuthContext);

    await next();
  } catch (error) {
    console.error("[AuthMiddleware] Error validating API key:", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "Failed to validate API key",
      },
      500,
    );
  }
}

/**
 * Helper to get auth context from request.
 * Must be used after authMiddleware.
 */
export function getAuthContext(c: Context): AuthContext {
  const auth = c.get("auth") as AuthContext;
  if (!auth) {
    throw new Error("Auth context not found. Did you use authMiddleware?");
  }
  return auth;
}
