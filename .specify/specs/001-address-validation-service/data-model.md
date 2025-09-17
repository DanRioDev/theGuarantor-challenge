# Data Models: Address Validation Service

## Overview
The service uses simple, focused data models that represent the API contracts and internal processing. Models are kept minimal to follow simplicity principles.

## API Input Model

### ValidateAddressRequest
```typescript
interface ValidateAddressRequest {
  address: string; // Required: Free-form address string
}
```

**Business Rules:**
- Address must be non-empty string
- No length restrictions (handled by provider)
- Single field to keep API simple

## API Output Model

### ValidateAddressResponse
```typescript
interface ValidateAddressResponse {
  status: 'valid' | 'corrected' | 'unverifiable';
  inputAddress: string;
  standardizedAddress: StandardizedAddress | null;
}
```

**Business Rules:**
- Status reflects validation confidence level
- Input address preserved for client reference
- Standardized address null for unverifiable cases

### StandardizedAddress
```typescript
interface StandardizedAddress {
  streetNumber: string;
  streetName: string;
  streetSuffix: string;
  secondaryDesignator?: string; // e.g., "Apt", "Suite"
  secondaryNumber?: string;     // e.g., "4B", "200"
  city: string;
  state: string;                // 2-letter abbreviation
  zipCode: string;              // 5-digit ZIP
  zipPlus4: string;             // 4-digit extension
}
```

**Business Rules:**
- All fields required except secondary (optional)
- Standardized format for consistency
- USPS-compliant structure

## Internal Processing Models

### NormalizedAddress (Cache Key)
```typescript
type NormalizedAddress = string;
```

**Business Rules:**
- Lowercase, trimmed, spaces normalized
- Used as Redis cache key
- Deterministic transformation for consistent caching

### ProviderResponse (Internal)
Maps to SmartyStreets API response structure:
```typescript
interface ProviderResponse {
  dpv_match_code?: string;      // Delivery Point Validation
  dpv_vacant?: string;          // Vacant indicator
  dpv_no_stat?: string;         // No stat indicator
  // ... other provider fields
}
```

**Business Rules:**
- Internal mapping to our simplified status
- Raw response logged for debugging
- Business logic converts to our enum values

## Status Mapping Logic

### Status Determination Rules
- **valid**: dpv_match_code indicates exact match, no corrections needed
- **corrected**: Address standardized but input had minor issues (typos, missing ZIP)
- **unverifiable**: No deliverable match found or ambiguous results

**Why this mapping?** Simplifies complex provider responses into clear, actionable status for clients. Hides provider-specific codes while preserving essential validation information.

## Cache Model

### Redis Key Format
```
address:validation:{normalized_address}
```

### Cache Value
```json
{
  "status": "valid",
  "inputAddress": "1600 Pennsylvania Ave NW, Washington DC 20500",
  "standardizedAddress": {
    "streetNumber": "1600",
    "streetName": "Pennsylvania",
    "streetSuffix": "Ave",
    "city": "Washington",
    "state": "DC",
    "zipCode": "20500",
    "zipPlus4": "0003"
  },
  "cachedAt": "2025-01-15T10:30:00Z"
}
```

**Business Rules:**
- TTL: 30 days (balance cost vs freshness)
- Cache-aside pattern: check cache first, populate on miss
- Invalidation: Natural expiration, no manual invalidation needed

## Error Models

### ErrorResponse
```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
}
```

**Business Rules:**
- Standard NestJS error format
- Appropriate HTTP status codes
- Clear, actionable error messages

## Model Validation Rules

### Input Validation
- Address: required, non-empty string
- No other fields accepted (keeps API simple)

### Output Validation
- Status: must be one of three enum values
- Standardized address: complete or null
- All required fields present

**Why strict validation?** Ensures API contract compliance and prevents invalid data propagation.

## Database Schema (Future Consideration)
Currently no persistent storage needed - Redis handles caching. If future requirements need persistence (e.g., audit trail), consider:

```sql
CREATE TABLE address_validations (
  id UUID PRIMARY KEY,
  input_address TEXT NOT NULL,
  normalized_key TEXT NOT NULL,
  status TEXT NOT NULL,
  standardized_address JSONB,
  provider_response JSONB,
  created_at TIMESTAMP NOT NULL,
  cached_until TIMESTAMP
);
```

**Why no database initially?** Follows YAGNI - caching covers current needs without added complexity.

