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
