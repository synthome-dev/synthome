import crypto from "crypto";
import { db, apiKeys, eq, and } from "@repo/db";
import { generateId } from "@repo/tools";
import type {
  ApiKeyGenerationResult,
  ApiKeyInfo,
  ValidatedApiKey,
} from "./types";

export class ApiKeyService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ALGORITHM = "aes-256-gcm";
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;

  constructor() {
    // Get encryption key from environment variable
    const encryptionKey = process.env.API_KEY_ENCRYPTION_SECRET;
    if (!encryptionKey) {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET environment variable is required",
      );
    }
    // Ensure key is 32 bytes for AES-256
    this.ENCRYPTION_KEY = crypto
      .createHash("sha256")
      .update(encryptionKey)
      .digest();
  }

  /**
   * Encrypt an API key
   */
  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      this.ENCRYPTION_KEY,
      iv,
    );

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt an API key
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted key format");
    }

    const iv = Buffer.from(parts[0]!, "hex");
    const authTag = Buffer.from(parts[1]!, "hex");
    const encryptedText = parts[2]!;

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      this.ENCRYPTION_KEY,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

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

    // Hash for validation (used for API authentication)
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Encrypt for storage (can be decrypted for display)
    const keyEncrypted = this.encrypt(apiKey);

    // Store in database
    const records = await db
      .insert(apiKeys)
      .values({
        id: generateId(),
        organizationId: organizationId,
        keyHash: keyHash,
        keyEncrypted: keyEncrypted,
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

    // Return plaintext key
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
   * List all API keys for an organization with decrypted keys
   */
  async listApiKeysWithDecryption(
    organizationId: string,
  ): Promise<Array<ApiKeyInfo & { decryptedKey: string }>> {
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.organizationId, organizationId),
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });

    return keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      environment: key.environment,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      revokedAt: key.revokedAt,
      expiresAt: key.expiresAt,
      decryptedKey: this.decrypt(key.keyEncrypted),
    }));
  }

  /**
   * List all API keys for an organization (without decrypted keys)
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
        // Excluded fields (not selected): keyHash, keyEncrypted, organizationId, lastUsedIp
      },
      orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
    });
  }

  /**
   * Delete an API key (hard delete)
   */
  async revokeApiKey(
    keyId: string,
    organizationId?: string,
  ): Promise<{ success: boolean }> {
    // If organizationId provided, verify ownership
    if (organizationId) {
      const key = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, keyId),
      });

      if (!key) {
        throw new Error("API key not found");
      }

      if (key.organizationId !== organizationId) {
        throw new Error("API key does not belong to this organization");
      }
    }

    // Hard delete the API key
    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

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
