# Address Validation Service

A NestJS-based microservice for validating and standardizing US addresses using third-party providers with intelligent caching and response transformation.

## Overview

This service provides a REST API endpoint at `POST /api/v1/validate-address` that accepts an address string and returns a standardized, validated address with detailed components. It's designed for high-performance address validation with cost optimization through caching and provider abstraction for easy testing and vendor flexibility.

## Architecture

The service follows a modular architecture with clear separation of concerns:

```
Request → Controller → Cache Check → Provider → Cache Store → Transformation → Response
```

### Key Components

- **Controller** (`ValidateAddressController`): Handles HTTP requests, orchestrates validation flow
- **Providers**: Abstract validation logic (Mock for development, SmartyStreets for production)
- **Caching Service**: Redis-based cache with normalized address keys
- **Response Transformation**: Standardizes provider responses into consistent API format

## API Specification

Based on the `.specify` contract, the service exposes:

### Endpoint

```
POST /api/v1/validate-address
Content-Type: application/json
```

### Request Body

```json
{
  "address": "1600 Pennsylvania Ave NW, Washington DC 20500"
}
```

### Response Format

```json
{
  "status": "valid" | "corrected" | "unverifiable",
  "inputAddress": "1600 Pennsylvania Ave NW, Washington DC 20500",
  "standardizedAddress": "1600 Pennsylvania Ave NW, Washington DC 20500-0003",
  "details": {
    "streetNumber": "1600",
    "streetName": "Pennsylvania",
    "streetSuffix": "Ave",
    "secondaryDesignator": null,
    "secondaryNumber": null,
    "city": "Washington",
    "state": "DC",
    "zipCode": "20500",
    "zipPlus4": "0003"
  }
}
```

## Code Walkthrough

### 1. Request Handling

The controller validates incoming requests using DTOs with class-validator:

```typescript
@Post('validate-address')
@HttpCode(HttpStatus.OK)
async validateAddress(@Body() dto: ValidateAddressDto) {
  // 1. Check cache first for performance
  const cachedResult = await this.cachingService.getCachedValidationResult(dto.address);
  if (cachedResult) {
    return this.responseTransformationService.transformValidationResult(cachedResult);
  }

  // 2. Cache miss - validate with provider
  const validationResult = await this.provider.validateAddress(dto.address);

  // 3. Cache the result for future requests
  await this.cachingService.setCachedValidationResult(dto.address, validationResult);

  // 4. Transform and return standardized response
  return this.responseTransformationService.transformValidationResult(validationResult);
}
```

**Why this flow?** Implements cache-aside pattern for optimal performance and cost savings. Cache hits avoid expensive third-party API calls.

### 2. Provider Abstraction

The service uses an interface-based provider pattern:

```typescript
export interface AddressValidationProvider {
  validateAddress(address: string): Promise<ValidationResult>;
}
```

**Mock Provider** (for development/testing):

```typescript
@Injectable()
export class MockAddressValidationProvider
  implements AddressValidationProvider
{
  async validateAddress(address: string): Promise<ValidationResult> {
    const mockAddress: StandardizedAddress = {
      streetNumber: '1600',
      streetName: 'Pennsylvania',
      streetSuffix: 'Ave',
      city: 'Washington',
      state: 'DC',
      zipCode: '20500',
      zipPlus4: '0003',
    };

    return {
      status: 'valid',
      inputAddress: address,
      standardizedAddress: mockAddress,
      rawResponse: { mock: true },
    };
  }
}
```

**Production Provider** (SmartyStreets):

- Uses circuit breaker pattern for resilience
- Handles API authentication via environment variables
- Maps SmartyStreets response to standardized format

**Rationale:** Provider abstraction allows seamless switching between mock (fast, reliable for dev) and real providers (accurate but costly/slower). Enables comprehensive testing without API calls.

### 3. Caching Strategy

Redis-based caching with address normalization:

```typescript
async setCachedValidationResult(address: string, result: ValidationResult): Promise<void> {
  const cacheKey = this.generateCacheKey(address); // Normalized key
  const ttl = result.status === 'unverifiable' ? 1 * 60 * 60 : 30 * 24 * 60 * 60;
  await client.set(cacheKey, JSON.stringify(result), 'EX', ttl);
}

generateCacheKey(address: string): string {
  const normalized = normalizeAddress(address);
  return `address:${normalized}`;
}
```

**Trade-offs:**

- **Pros:** Reduces third-party API costs (cache hit = free), improves response times
- **Cons:** Potential stale data if addresses change, cache invalidation complexity
- **TTL Strategy:** 30 days for valid/corrected addresses, 1 hour for unverifiable (allows re-validation)

### 4. Response Transformation

Standardizes provider responses into consistent API format:

```typescript
transformValidationResult(result: ValidationResult): TransformedValidationResponse {
  switch (result.status) {
    case 'valid':
      return {
        status: 'valid',
        inputAddress: result.inputAddress,
        standardizedAddress: this.formatStandardizedAddress(result.standardizedAddress!),
        details: this.mapStandardizedAddressToDetails(result.standardizedAddress!),
      };

    case 'corrected':
      return {
        status: 'corrected', // Indicates input had issues but was corrected
        inputAddress: result.inputAddress,
        standardizedAddress: this.formatStandardizedAddress(result.standardizedAddress!),
        originalInput: result.inputAddress, // Preserve original for comparison
        details: this.mapStandardizedAddressToDetails(result.standardizedAddress!),
      };

    case 'unverifiable':
      return {
        status: 'unverifiable',
        inputAddress: result.inputAddress,
        error: 'Address could not be verified',
      };
  }
}
```

**Why transformation?** Ensures API consistency regardless of provider response format. Provides both human-readable and structured address data.

## Configuration

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SmartyStreets Configuration (optional - if provided, uses SmartyStreets; otherwise uses mock)
SMARTY_AUTH_ID=your_auth_id
SMARTY_AUTH_TOKEN=your_auth_token

# Logging
LOG_LEVEL=info

# Health Check
HEALTH_CHECK_REDIS_TIMEOUT=5000
```

### Provider Selection

The service automatically selects the validation provider based on environment configuration:

- **SmartyStreets Provider**: Used when both `SMARTY_AUTH_ID` and `SMARTY_AUTH_TOKEN` are configured
- **Mock Provider**: Used when SmartyStreets credentials are not provided (ideal for development/testing)

This eliminates the need for an explicit provider selection environment variable.

## Development Setup

```bash
npm install
npm run start:dev
```

### Testing the API

If your Editor/IDE is VSCode, JetBrains or NeoVim (with Kulala.nvim)
you can use the .http file to test as in `Postman`

Or you can use the old and true cURL

```bash
# Valid address
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Ave NW, Washington DC 20500"}'

# Corrected address (with typos)
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 pennsylvania ave nw washington dc 20500"}'

# Unverifiable address
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Fake Street, Nowhere USA"}'
```

## Production Considerations

- **Rate Limiting:** Implemented at the application level using Redis-based rate limiter (100 requests per minute per IP) with fail-open behavior when Redis is unavailable
- **Monitoring:** Health checks implemented for Redis connectivity; consider adding metrics collection for cache hit rates, provider response times, and error rates in production
- **Security:** Input validation with class-validator, API keys secured via environment variables, CORS enabled
- **Scaling:** Single Redis instance for caching; consider Redis cluster for high availability and horizontal pod scaling for the service
- **Circuit Breaker:** Implemented for SmartyStreets provider resilience with configurable timeouts and error thresholds
- **Logging:** Structured JSON logging with Pino; consider adding request ID middleware for tracing

## Testing Strategy

- **Unit Tests:** Test individual components (transformation, caching logic)
- **Integration Tests:** Test full request flow with mock provider
- **Contract Tests:** Verify API responses match `.specify` contract
- **Provider Tests:** Use recorded responses for SmartyStreets integration tests

## Trade-offs and Decisions

1. **Caching vs. Freshness:** Cache improves performance but may serve stale data
2. **Provider Abstraction:** Adds complexity but enables testing and vendor flexibility
3. **Response Transformation:** Ensures consistency but adds processing overhead
4. **Circuit Breaker:** Prevents cascade failures but adds latency during recovery
5. **Address Normalization:** Improves cache hit rates but may lose subtle formatting differences

This service balances performance, cost, reliability, and maintainability for production address validation workflows.
