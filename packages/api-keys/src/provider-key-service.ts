import * as crypto from "crypto";
import { db, providerApiKeys, eq, and } from "@repo/db";
import { generateId } from "@repo/tools";

export class ProviderKeyService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ALGORITHM = "aes-256-gcm";
  private readonly IV_LENGTH = 16;

  constructor() {
    const encryptionKey = process.env.API_KEY_ENCRYPTION_SECRET;
    if (!encryptionKey) {
      throw new Error(
        "API_KEY_ENCRYPTION_SECRET environment variable is required",
      );
    }
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
   * Extract key prefix for display
   */
  private extractKeyPrefix(provider: string, key: string): string | null {
    switch (provider) {
      case "replicate":
        return key.substring(0, 5); // "r8_xx"
      case "fal":
        return key.substring(0, 8);
      case "google-cloud":
        return key.substring(0, 8);
      case "hume":
        return key.substring(0, 8);
      case "elevenlabs":
        return key.substring(0, 8);
      default:
        return null;
    }
  }

  /**
   * Validate provider API key format
   */
  private validateProviderKey(provider: string, key: string): boolean {
    switch (provider) {
      case "replicate":
        return key.startsWith("r8_") && key.length >= 20;
      case "fal":
        return key.length >= 20;
      case "google-cloud":
        return key.length >= 20;
      case "hume":
        return key.length >= 20;
      case "elevenlabs":
        return key.length >= 20;
      default:
        return false;
    }
  }

  /**
   * Initialize empty provider key records for a new organization
   * Called from Clerk webhook on organization creation
   */
  async initializeProviderKeys(organizationId: string): Promise<void> {
    const providers = [
      "replicate",
      "fal",
      "google-cloud",
      "hume",
      "elevenlabs",
    ] as const;

    for (const provider of providers) {
      await db.insert(providerApiKeys).values({
        id: generateId(),
        organizationId,
        provider,
        keyEncrypted: null,
        keyPrefix: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Update a provider API key (user sets/updates key from UI)
   */
  async updateProviderKey(params: {
    organizationId: string;
    provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
    apiKey: string;
  }): Promise<{ success: boolean }> {
    const { organizationId, provider, apiKey } = params;

    // Validate key format
    if (!this.validateProviderKey(provider, apiKey)) {
      throw new Error(`Invalid ${provider} API key format`);
    }

    const keyEncrypted = this.encrypt(apiKey);
    const keyPrefix = this.extractKeyPrefix(provider, apiKey);

    await db
      .update(providerApiKeys)
      .set({
        keyEncrypted,
        keyPrefix,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(providerApiKeys.organizationId, organizationId),
          eq(providerApiKeys.provider, provider),
        ),
      );

    return { success: true };
  }

  /**
   * List provider keys for an organization (without decryption)
   */
  async listProviderKeys(organizationId: string) {
    return await db.query.providerApiKeys.findMany({
      where: eq(providerApiKeys.organizationId, organizationId),
      columns: {
        id: true,
        provider: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (providerApiKeys, { asc }) => [asc(providerApiKeys.provider)],
    });
  }

  /**
   * Get decrypted provider keys for use in execution
   * Returns only keys that have been set (keyEncrypted is not null)
   */
  async getProviderKeysForExecution(organizationId: string): Promise<{
    replicate?: string;
    fal?: string;
    "google-cloud"?: string;
    hume?: string;
    elevenlabs?: string;
  }> {
    const keys = await db.query.providerApiKeys.findMany({
      where: eq(providerApiKeys.organizationId, organizationId),
    });

    const result: {
      replicate?: string;
      fal?: string;
      "google-cloud"?: string;
      hume?: string;
      elevenlabs?: string;
    } = {};

    for (const key of keys) {
      if (key.keyEncrypted && key.isActive) {
        const decrypted = this.decrypt(key.keyEncrypted);
        if (key.provider === "replicate") {
          result.replicate = decrypted;
        } else if (key.provider === "fal") {
          result.fal = decrypted;
        } else if (key.provider === "google-cloud") {
          result["google-cloud"] = decrypted;
        } else if (key.provider === "hume") {
          result.hume = decrypted;
        } else if (key.provider === "elevenlabs") {
          result.elevenlabs = decrypted;
        }
      }
    }

    return result;
  }

  /**
   * Delete a provider key (set keyEncrypted to null)
   */
  async deleteProviderKey(params: {
    organizationId: string;
    provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  }): Promise<void> {
    await db
      .update(providerApiKeys)
      .set({
        keyEncrypted: null,
        keyPrefix: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(providerApiKeys.organizationId, params.organizationId),
          eq(providerApiKeys.provider, params.provider),
        ),
      );
  }

  /**
   * Update last used timestamp (called from execution orchestrator)
   */
  async markProviderKeyUsed(params: {
    organizationId: string;
    provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  }): Promise<void> {
    await db
      .update(providerApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(
        and(
          eq(providerApiKeys.organizationId, params.organizationId),
          eq(providerApiKeys.provider, params.provider),
        ),
      );
  }
}

// Export singleton instance
export const providerKeyService = new ProviderKeyService();
