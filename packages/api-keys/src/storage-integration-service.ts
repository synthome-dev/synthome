import { db, eq, storageIntegrations } from "@repo/db";
import { generateId } from "@repo/tools";
import * as crypto from "crypto";
import type { StorageConfig, StorageIntegrationInfo } from "./types";

export class StorageIntegrationService {
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
   * Encrypt a value
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
   * Decrypt a value
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted value format");
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
   * Initialize empty storage integration record for a new organization
   * Called from Clerk webhook on organization creation
   */
  async initializeStorageIntegration(organizationId: string): Promise<void> {
    // Check if record already exists
    const existing = await db.query.storageIntegrations.findFirst({
      where: eq(storageIntegrations.organizationId, organizationId),
    });

    if (existing) {
      return; // Already initialized
    }

    await db.insert(storageIntegrations).values({
      id: generateId(),
      organizationId,
      accessKeyEncrypted: null,
      secretKeyEncrypted: null,
      endpoint: null,
      region: null,
      bucket: null,
      cdnUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update storage integration (user sets/updates from UI)
   */
  async updateStorageIntegration(params: {
    organizationId: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    region: string;
    bucket: string;
    cdnUrl?: string;
  }): Promise<{ success: boolean }> {
    const {
      organizationId,
      accessKey,
      secretKey,
      endpoint,
      region,
      bucket,
      cdnUrl,
    } = params;

    // Validate required fields
    if (!accessKey || accessKey.length < 10) {
      throw new Error("Invalid access key");
    }
    if (!secretKey || secretKey.length < 10) {
      throw new Error("Invalid secret key");
    }
    if (!endpoint) {
      throw new Error("Endpoint is required");
    }
    if (!region) {
      throw new Error("Region is required");
    }
    if (!bucket) {
      throw new Error("Bucket is required");
    }

    const accessKeyEncrypted = this.encrypt(accessKey);
    const secretKeyEncrypted = this.encrypt(secretKey);

    // Check if record exists
    const existing = await db.query.storageIntegrations.findFirst({
      where: eq(storageIntegrations.organizationId, organizationId),
    });

    if (existing) {
      await db
        .update(storageIntegrations)
        .set({
          accessKeyEncrypted,
          secretKeyEncrypted,
          endpoint,
          region,
          bucket,
          cdnUrl: cdnUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(storageIntegrations.organizationId, organizationId));
    } else {
      // Create if doesn't exist (handles edge case)
      await db.insert(storageIntegrations).values({
        id: generateId(),
        organizationId,
        accessKeyEncrypted,
        secretKeyEncrypted,
        endpoint,
        region,
        bucket,
        cdnUrl: cdnUrl || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  }

  /**
   * Get storage integration info for an organization (without decryption)
   */
  async getStorageIntegration(
    organizationId: string,
  ): Promise<StorageIntegrationInfo | null> {
    const integration = await db.query.storageIntegrations.findFirst({
      where: eq(storageIntegrations.organizationId, organizationId),
    });

    if (!integration) {
      return null;
    }

    return {
      id: integration.id,
      endpoint: integration.endpoint,
      region: integration.region,
      bucket: integration.bucket,
      cdnUrl: integration.cdnUrl,
      hasCredentials: !!(
        integration.accessKeyEncrypted && integration.secretKeyEncrypted
      ),
      isActive: integration.isActive,
      lastUsedAt: integration.lastUsedAt,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  /**
   * Get decrypted storage config for use in storage operations
   * Returns null if no integration is configured
   */
  async getStorageConfigForExecution(
    organizationId: string,
  ): Promise<StorageConfig | null> {
    const integration = await db.query.storageIntegrations.findFirst({
      where: eq(storageIntegrations.organizationId, organizationId),
    });

    if (!integration) {
      return null;
    }

    // Check if credentials are set and active
    if (
      !integration.accessKeyEncrypted ||
      !integration.secretKeyEncrypted ||
      !integration.isActive
    ) {
      return null;
    }

    // Check required fields
    if (!integration.endpoint || !integration.bucket || !integration.region) {
      return null;
    }

    try {
      const accessKeyId = this.decrypt(integration.accessKeyEncrypted);
      const secretAccessKey = this.decrypt(integration.secretKeyEncrypted);

      return {
        accessKeyId,
        secretAccessKey,
        endpoint: integration.endpoint,
        region: integration.region,
        bucket: integration.bucket,
        cdnUrl: integration.cdnUrl || integration.endpoint,
      };
    } catch (error) {
      console.error(
        "[StorageIntegrationService] Failed to decrypt storage credentials:",
        error,
      );
      return null;
    }
  }

  /**
   * Delete storage integration (clear all config)
   */
  async deleteStorageIntegration(organizationId: string): Promise<void> {
    await db
      .update(storageIntegrations)
      .set({
        accessKeyEncrypted: null,
        secretKeyEncrypted: null,
        endpoint: null,
        region: null,
        bucket: null,
        cdnUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(storageIntegrations.organizationId, organizationId));
  }

  /**
   * Update last used timestamp (called from storage operations)
   */
  async markStorageUsed(organizationId: string): Promise<void> {
    await db
      .update(storageIntegrations)
      .set({ lastUsedAt: new Date() })
      .where(eq(storageIntegrations.organizationId, organizationId));
  }

  /**
   * Get storage config with fallback to environment variables
   * This is the main method to use when you need storage config
   */
  async getStorageConfig(organizationId?: string): Promise<StorageConfig> {
    // Try to get org-specific config if organizationId is provided
    if (organizationId) {
      const orgConfig = await this.getStorageConfigForExecution(organizationId);
      if (orgConfig) {
        return orgConfig;
      }
    }

    // Fall back to environment variables
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const endpoint = process.env.S3_URL;
    const region = process.env.S3_REGION || "us-east-1";
    const bucket = process.env.S3_BUCKET || "default";
    const cdnUrl = process.env.S3_CDN_URL || "https://cdn.synthome.dev";

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        "Storage configuration not found. Either set up a storage integration or configure S3_ACCESS_KEY, S3_SECRET_KEY, and S3_URL environment variables.",
      );
    }

    return {
      accessKeyId,
      secretAccessKey,
      endpoint,
      region,
      bucket,
      cdnUrl,
    };
  }
}

// Export singleton instance
export const storageIntegrationService = new StorageIntegrationService();
