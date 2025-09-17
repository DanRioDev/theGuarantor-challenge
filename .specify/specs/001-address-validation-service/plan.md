# Implementation Plan: Address Validation Service (001)

## Executive Summary
Implement a NestJS-based address validation service that provides a clean API facade over SmartyStreets, with Redis caching and comprehensive testing. The service will handle US address validation with three status types: valid, corrected, and unverifiable.

## Architecture Overview

### Core Architecture
- **NestJS Application**: Main service with Dependency Injection
- **AddressValidationProvider Interface**: Abstracts third-party provider
- **SmartyStreetsProvider**: Concrete implementation of provider interface
- **Redis Cache**: Cache-aside strategy with normalized keys
- **Circuit Breaker**: Resilience pattern for provider failures

### Data Flow
1. Client POST to /api/v1/validate-address
2. Check Redis cache with normalized key
3. If cache miss, call SmartyStreets API
4. Store result in cache (TTL: 30 days)
5. Return standardized response

## Technology Choices & Rationale

### Framework: NestJS
- **Rationale**: Provides structured TypeScript architecture with DI for easy testing and provider swapping
- **Constitutional Compliance**: Follows Simplicity (Article VII) by using framework directly without unnecessary wrappers

### External Provider: SmartyStreets
- **Rationale**: CASS-certified, clean API, handles USPS data complexity
- **Alternative Considered**: Google Maps (rejected due to vendor lock-in concerns)

### Caching: Redis
- **Rationale**: High-performance key-value store for cache-aside pattern
- **TTL Strategy**: 30 days balances cost reduction (~90% hit rate) vs data freshness

### Containerization: Docker + Compose
- **Rationale**: Ensures consistent dev/CI/prod environments
- **Setup**: Single docker-compose up command

### Observability: Pino + Terminus
- **Rationale**: Structured JSON logging with request tracing
- **Health Checks**: /health endpoint for load balancer compatibility

## Phase Breakdown

### Phase 1: Foundation Setup
**Deliverables:**
- NestJS project scaffold with basic structure
- Docker setup with Redis container
- AddressValidationProvider interface definition
- Basic health check endpoint

**Estimated Effort**: 2 days

### Phase 2: Core Validation Logic
**Deliverables:**
- SmartyStreetsProvider implementation
- Address normalization and caching logic
- Input validation and error handling
- Circuit breaker implementation

**Estimated Effort**: 3 days

### Phase 3: API Implementation
**Deliverables:**
- POST /api/v1/validate-address endpoint
- Response transformation to standardized format
- Rate limiting implementation
- .http files for documentation

**Estimated Effort**: 2 days

### Phase 4: Testing & Observability
**Deliverables:**
- Unit tests for all components
- Integration tests with real Redis
- E2E tests for API endpoints
- Structured logging implementation
- Comprehensive .http test files

**Estimated Effort**: 3 days

### Phase 5: Production Readiness
**Deliverables:**
- Docker optimization
- Environment configuration
- Performance testing
- Documentation completion

**Estimated Effort**: 2 days

## File Creation Order (Constitutional Compliance)

1. **API Contracts**: Define endpoint specifications in contracts/
2. **Contract Tests**: Write tests for API behavior
3. **Integration Tests**: Test with real dependencies
4. **Source Code**: Implement to pass tests
5. **E2E Tests**: Full request/response validation
6. **Unit Tests**: Edge case coverage

## Data Models

### Input Contract
```typescript
interface ValidateAddressRequest {
  address: string;
}
```

### Output Contract
```typescript
interface ValidateAddressResponse {
  status: 'valid' | 'corrected' | 'unverifiable';
  inputAddress: string;
  standardizedAddress: StandardizedAddress | null;
}

interface StandardizedAddress {
  streetNumber: string;
  streetName: string;
  streetSuffix: string;
  secondaryDesignator?: string;
  secondaryNumber?: string;
  city: string;
  state: string;
  zipCode: string;
  zipPlus4: string;
}
```

## Testing Strategy

### Test-First Approach
- Write tests before implementation
- Contract tests for API behavior
- Integration tests with real Redis
- Mock SmartyStreets for unit tests
- Real API calls for E2E tests

### Test Coverage
- Happy path validation
- Error scenarios (400, 429, 500, 503)
- Caching behavior
- Circuit breaker activation
- Rate limiting

## Contracts Directory Structure

```
contracts/
├── validate-address.http      # API documentation
├── test-valid-address.http    # Test case examples
├── test-corrected-address.http
├── test-unverifiable-address.http
├── test-error-400.http
├── test-error-429.http
├── test-error-503.http
```

## Risk Mitigation

### Provider Failure
- Circuit breaker prevents cascading failures
- 503 response allows graceful degradation

### Cost Control
- Aggressive caching reduces API calls by ~90%
- Rate limiting prevents abuse

### Data Freshness
- 30-day TTL based on business analysis
- Monitoring for cache hit rates and invalidation needs

## Phase -1: Pre-Implementation Gates

### Simplicity Gate (Article VII)
- [x] Using ≤3 projects? (1 main project)
- [x] No future-proofing? (YAGNI compliant)
- [x] Maximum 3 projects for initial implementation

### Anti-Abstraction Gate (Article VIII)
- [x] Using framework directly? (NestJS without wrappers)
- [x] Single model representation? (Direct API responses)

### Integration-First Gate (Article IX)
- [x] Contracts defined? (Yes, in this plan)
- [x] Contract tests written? (Yes, in testing strategy)

## Complexity Tracking
No violations of simplicity principles identified. Single project structure maintains clean separation of concerns without unnecessary abstraction layers.

## Success Criteria
- All acceptance criteria from spec.md met
- 100% test coverage on business logic
- <500ms response time for cached requests
- 99.9% uptime during testing
- All .http files executable and documented

## Next Steps
1. Create contracts/ directory with .http files
2. Implement Phase 1 foundation
3. Write contract tests
4. Proceed with TDD implementation

