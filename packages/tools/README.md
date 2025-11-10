# @repo/tools

Shared utility functions and tools for the Open Video monorepo.

## Features

- **ID Generation**: Alphanumeric IDs using nanoid with custom alphabet

## Usage

### Generate Unique IDs

```typescript
import { generateId } from "@repo/tools";

const id = generateId(); // Returns 21-character alphanumeric ID
// Example: "3V9kN7jQ2xR8mL5pW1zY4"

// Custom length
import { generateIdWithLength } from "@repo/tools";
const shortId = generateIdWithLength(10); // Returns 10-character ID
```

### ID Generator Details

- **Alphabet**: `0-9`, `a-z`, `A-Z` (62 characters)
- **Default Length**: 21 characters (~149 bits of entropy)
- **URL-safe**: No special characters
- **Collision-resistant**: Extremely low probability of duplicates

### Entropy Analysis

- 21 chars: ~149 bits (~1 million IDs/second for 5 years without collision)
- 16 chars: ~114 bits (good for most use cases)
- 12 chars: ~86 bits (suitable for session IDs)

## Why Not UUID?

- **Shorter**: 21 chars vs 36 chars for UUID
- **URL-friendly**: No hyphens or special characters
- **Case-sensitive**: More entropy per character
- **Customizable**: Can adjust length based on needs

## License

MIT
