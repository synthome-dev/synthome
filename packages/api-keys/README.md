# @repo/api-keys

API key generation, validation, and management for Synthome (Open Video).

## Features

- **Secure API Key Generation**: Creates keys in Synthome format (`sy_live_*` or `sy_test_*`)
- **SHA-256 Hashing**: Never stores plaintext keys in the database
- **Key Validation**: Fast lookup with organization context
- **Key Management**: List, revoke, and rotate API keys
- **Environment Separation**: Separate test and production keys
- **Clerk Integration**: Uses Clerk organization IDs for multi-tenant management

## Installation

This is an internal monorepo package. It's automatically available in the workspace.

```bash
bun add @repo/api-keys
```

## Usage

### Generate a New API Key

```typescript
import { apiKeyService } from "@repo/api-keys";

// Generate a production key
const result = await apiKeyService.generateApiKey(
  "org_2abc123xyz", // Clerk Organization ID
  "production", // Environment
  "My API Key", // Optional name
);

console.log(result.apiKey); // sy_live_a1b2c3d4... (show only once!)
console.log(result.id); // Key ID for management
```

**Important**: The plaintext API key is only returned once during generation. Store it securely!

### Validate an API Key

```typescript
const validated = await apiKeyService.validateApiKey(apiKey);

if (!validated) {
  throw new Error("Invalid or inactive API key");
}

console.log(validated.organizationId); // Clerk org ID
console.log(validated.environment); // "test" | "production"

// Fetch full organization details from Clerk separately
const org = await clerkClient.organizations.getOrganization({
  organizationId: validated.organizationId,
});
```

### List Organization Keys

```typescript
const keys = await apiKeyService.listApiKeys("org_2abc123xyz");

keys.forEach((key) => {
  console.log(key.keyPrefix); // sy_live_ or sy_test_
  console.log(key.isActive); // true/false
  console.log(key.lastUsedAt); // Last usage timestamp
});
```

## Usage

### Generate a New API Key

```typescript
import { apiKeyService } from "@repo/api-keys";

// Generate a production key
const result = await apiKeyService.generateApiKey(
  "org_abc123", // Organization ID
  "production", // Environment
  "My API Key", // Optional name
);

console.log(result.apiKey); // sy_live_a1b2c3d4... (show only once!)
console.log(result.id); // Key ID for management
```

**Important**: The plaintext API key is only returned once during generation. Store it securely!

### Validate an API Key

```typescript
const validated = await apiKeyService.validateApiKey(apiKey);

if (!validated) {
  throw new Error("Invalid or inactive API key");
}

console.log(validated.organizationId);
console.log(validated.organization.planType); // "free" | "pro" | "custom"
```

### List Organization Keys

```typescript
const keys = await apiKeyService.listApiKeys("org_abc123");

keys.forEach((key) => {
  console.log(key.prefix); // sy_live_ or sy_test_
  console.log(key.isActive); // true/false
  console.log(key.lastUsedAt); // Last usage timestamp
});
```

### Revoke a Key

```typescript
await apiKeyService.revokeApiKey("key_xyz789");
```

### Rotate a Key

```typescript
// Revokes old key and generates a new one with same settings
const newKey = await apiKeyService.rotateApiKey("key_xyz789");

console.log(newKey.apiKey); // New plaintext key
console.log(newKey.rotatedFrom); // Old key ID
```

## API Key Format

- **Production**: `sy_live_<64-hex-characters>`
- **Test**: `sy_test_<64-hex-characters>`

Example: `sy_live_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890`

## Security

- Keys are hashed using SHA-256 before storage
- Only the hash is stored in the database
- Plaintext keys are only shown once at generation time
- Supports optional expiration dates
- Tracks last used IP and timestamp

## Types

### ApiKeyGenerationResult

```typescript
{
  apiKey: string; // Plaintext key (show once)
  id: string; // Key ID for management
  prefix: string; // "sy_live_" or "sy_test_"
  environment: "test" | "production";
}
```

### ValidatedApiKey

```typescript
{
  id: string;
  organizationId: string; // Clerk organization ID
  environment: "test" | "production";
  name: string | null;
  keyPrefix: string;
}
```

### ApiKeyInfo

```typescript
{
  id: string;
  name: string | null;
  keyPrefix: string; // "sy_live_" or "sy_test_"
  environment: "test" | "production";
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
}
```

## Database Schema

This package requires the billing system database tables:

- `api_keys`
- `usage_limits`
- `action_logs`

**Note**: This package uses Clerk for organization management. No separate `organizations` table is needed.

Run the migration: `drizzle-kit push` or apply `0004_add_billing_system.sql`

## Integration with Backend

See the main backend documentation for integrating API key authentication:

```typescript
// In your backend middleware
import { apiKeyService } from "@repo/api-keys";
import { clerkClient } from "@clerk/clerk-sdk-node";

const apiKey = req.headers["x-api-key"];
const validated = await apiKeyService.validateApiKey(apiKey);

if (!validated) {
  return res.status(401).json({ error: "Invalid API key" });
}

// Fetch organization from Clerk
const org = await clerkClient.organizations.getOrganization({
  organizationId: validated.organizationId,
});

// Attach organization context to request
req.organizationId = validated.organizationId;
req.organization = org;
```

### ApiKeyInfo

```typescript
{
  id: string;
  name: string | null;
  prefix: string;
  environment: "test" | "production";
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
}
```

## Database Schema

This package requires the billing system database tables:

- `organizations`
- `api_keys`
- `usage_limits`
- `action_logs`

Run the migration: `drizzle-kit push` or apply `0004_add_billing_system.sql`

## Integration with Backend

See the main backend documentation for integrating API key authentication:

```typescript
// In your backend middleware
import { apiKeyService } from "@repo/api-keys";

const apiKey = req.headers["x-api-key"];
const validated = await apiKeyService.validateApiKey(apiKey);

if (!validated) {
  return res.status(401).json({ error: "Invalid API key" });
}

// Attach organization context to request
req.organizationId = validated.organizationId;
req.organization = validated.organization;
```

## License

MIT
