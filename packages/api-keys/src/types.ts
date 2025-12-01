export interface ApiKeyGenerationResult {
  apiKey: string; // Plaintext key (show once)
  id: string;
  prefix: string;
  environment: "test" | "production";
}

export interface ApiKeyInfo {
  id: string;
  name: string | null;
  keyPrefix: string; // 'sy_live_' or 'sy_test_'
  environment: "test" | "production";
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
}

export interface ValidatedApiKey {
  id: string;
  organizationId: string; // Clerk organization ID
  environment: "test" | "production";
  name: string | null;
  keyPrefix: string; // 'sy_live_' or 'sy_test_'
}

export interface ProviderKeyInfo {
  id: string;
  provider: "replicate" | "fal" | "google-cloud" | "hume" | "elevenlabs";
  keyPrefix: string | null;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageConfig {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
  bucket: string;
  cdnUrl: string;
}

export interface StorageIntegrationInfo {
  id: string;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  cdnUrl: string | null;
  hasCredentials: boolean;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
