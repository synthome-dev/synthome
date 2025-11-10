import crypto from "crypto";
import { db, apiKeys, eq, and } from "@repo/db";
import { generateId } from "@repo/tools";
import type {
  ApiKeyGenerationResult,
  ApiKeyInfo,
  ValidatedApiKey,
} from "./types";

export class ApiKeyService {
  /**
   * Generate a new API key with Synthome format
   * Format: sy_live_<64-hex-chars> or sy_test_<64-hex-chars>
   */
  async generateApiKey(
    organizationId: string, // Clerk organization ID
    environment: "test" | "production",
    name?: string,
  ): Promise<ApiKeyGenerationResult> {
    // Note: organizationId is a Clerk org ID - no need to verify it exists in DB

    // Generate key with sy_ prefix for Synthome
    const prefix = environment === "test" ? "sy_test_" : "sy_live_";
    const randomBytes = crypto.randomBytes(32).toString("hex"); // 64 chars
    const apiKey = `${prefix}${randomBytes}`;

    // Hash for storage (never store plaintext)
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Store in database
    const records = await db
      .insert(apiKeys)
      .values({
        id: generateId(),
        organizationId: organizationId,
        keyHash: keyHash,
        keyPrefix: prefix,
        name: name || null,
        environment: environment,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    const record = records[0];
    if (!record) {
      throw new Error("Failed to create API key");
    }

    // Return plaintext key ONLY ONCE
    return {
      apiKey: apiKey,
      id: record.id,
      prefix: prefix,
      environment: environment,
    };
  }

  /**
   * Validate an API key and return organization info
   * Note: This only validates the key exists and is active.
   * Organization details should be fetched from Clerk separately.
   */
  async validateApiKey(apiKey: string): Promise<ValidatedApiKey | null> {
    // Hash the provided key
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Look up in database
    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)),
    });

    if (!key) return null;

    // Check if expired
    if (key.expiresAt && key.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp (async, don't block)
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id))
      .execute()
      .catch((err) => console.error("Failed to update last_used_at:", err));

    return {
      id: key.id,
      organizationId: key.organizationId,
      environment: key.environment,
      name: key.name,
      keyPrefix: key.keyPrefix,
    };
  }

  /**
   * List all API keys for an organization (without plaintext or hash)
   * Uses Drizzle's column selection for type-safe field exclusion
   */
  async listApiKeys(organizationId: string): Promise<ApiKeyInfo[]> {
    return await db.query.apiKeys.findMany({
      where: eq(apiKeys.organizationId, organizationId),
      columns: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
        expiresAt: true,
        // Excluded fields (not selected): keyHash, organizationId, lastUsedIp
      },
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });
  }

  /**
   * Revoke an API key (soft delete)
   */
  async revokeApiKey(keyId: string): Promise<{ success: boolean }> {
    await db
      .update(apiKeys)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(eq(apiKeys.id, keyId));

    return { success: true };
  }

  /**
   * Rotate an API key (revoke old, create new)
   */
  async rotateApiKey(
    keyId: string,
  ): Promise<ApiKeyGenerationResult & { rotatedFrom: string }> {
    // Get old key info
    const oldKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, keyId),
    });

    if (!oldKey) {
      throw new Error(`API key ${keyId} not found`);
    }

    // Revoke old key
    await this.revokeApiKey(keyId);

    // Generate new key with same config
    const newKey = await this.generateApiKey(
      oldKey.organizationId,
      oldKey.environment,
      oldKey.name ? `${oldKey.name} (rotated)` : undefined,
    );

    return {
      ...newKey,
      rotatedFrom: keyId,
    };
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();
