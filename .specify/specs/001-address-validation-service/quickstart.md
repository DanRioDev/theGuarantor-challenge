# Quickstart: Address Validation Service

## Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- SmartyStreets API credentials (SMARTY_AUTH_ID, SMARTY_AUTH_TOKEN)

## Local Development Setup

### 1. Clone and Setup
```bash
git clone <repository>
cd address-validation-service
cp .env.example .env
# Edit .env with your SmartyStreets credentials
```

### 2. Start Services
```bash
docker-compose up --build
```

### 3. Verify Health
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","details":{"redis":{"status":"up"}}}
```

## Key Validation Scenarios

### Scenario 1: Valid Address
**Input:**
```bash
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 Pennsylvania Ave NW, Washington DC 20500"}'
```

**Expected Output:**
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
  }
}
```

### Scenario 2: Corrected Address (Typos)
**Input:**
```bash
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "1600 pennsylvania ave washington dc"}'
```

**Expected Output:**
```json
{
  "status": "corrected",
  "inputAddress": "1600 pennsylvania ave washington dc",
  "standardizedAddress": {
    "streetNumber": "1600",
    "streetName": "Pennsylvania",
    "streetSuffix": "Ave",
    "city": "Washington",
    "state": "DC",
    "zipCode": "20500",
    "zipPlus4": "0003"
  }
}
```

### Scenario 3: Unverifiable Address
**Input:**
```bash
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Fake Street, Nowhere USA"}'
```

**Expected Output:**
```json
{
  "status": "unverifiable",
  "inputAddress": "123 Fake Street, Nowhere USA",
  "standardizedAddress": null
}
```

### Scenario 4: Error Handling (Invalid Input)
**Input:**
```bash
curl -X POST http://localhost:3000/api/v1/validate-address \
  -H "Content-Type: application/json" \
  -d '{"location": "1600 Pennsylvania Ave"}'
```

**Expected Output (400):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Testing with .http Files

Use VS Code with REST Client extension to run the provided .http files:

1. Open `.specify/specs/001-address-validation-service/contracts/validate-address.http`
2. Click "Send Request" on each example
3. Verify responses match expectations

## Caching Verification

### First Request (Cache Miss)
- Response time: ~500-1000ms
- Logs show: "Cache miss for key: address:validation:1600pennsylvaniaavenwashingtondc20500"

### Second Request (Cache Hit)
- Response time: <100ms
- Logs show: "Cache hit for key: address:validation:1600pennsylvaniaavenwashingtondc20500"

## Common Issues & Troubleshooting

### Service Won't Start
- **Issue**: Docker containers fail
- **Solution**: Ensure ports 3000, 6379 are available
- **Check**: `docker-compose logs`

### Provider Errors (503)
- **Issue**: SmartyStreets API unreachable
- **Solution**: Verify credentials in .env
- **Check**: Circuit breaker may be open - wait 30s for reset

### Cache Not Working
- **Issue**: No performance improvement on repeat requests
- **Solution**: Check Redis connectivity
- **Check**: `docker-compose exec redis redis-cli ping`

## Performance Benchmarks

| Scenario | Expected Time | Notes |
|----------|---------------|--------|
| Cache Hit | <100ms | Warm cache |
| Cache Miss | 500-1000ms | First request |
| Provider Down | <50ms | Circuit breaker |
| Invalid Input | <10ms | Client validation |

## Monitoring

### Key Metrics to Watch
- Response time percentiles (P50, P95, P99)
- Cache hit rate (>90% target)
- Error rate by type (4xx vs 5xx)
- Provider API call frequency

### Logs to Monitor
- "Cache hit/miss" for caching effectiveness
- "Circuit breaker opened/closed" for resilience
- "Rate limit exceeded" for abuse detection

## Next Steps

1. **Run Full Test Suite**: Execute all .http files
2. **Load Testing**: Simulate production traffic patterns
3. **Integration Testing**: Test with your application
4. **Production Deployment**: Configure environment variables
5. **Monitoring Setup**: Connect to your observability stack

## API Reference

- **Base URL**: http://localhost:3000/api/v1
- **Health Check**: GET /health
- **Validation**: POST /validate-address

See contracts/ directory for complete API documentation and test cases.

