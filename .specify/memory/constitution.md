# Address Validation Constitution

## Core Principles

### I. Anti-Corruption Layer
Our service acts as a robust facade and Anti-Corruption Layer over third-party address validation providers. We do not build the validation logic ourselves, as address validation is fundamentally a data problem managed by the USPS. Our value lies in providing a clean, consistent, and simple API to the organization, while abstracting away provider complexities, costs, and failures.

### II. Library-First
Every feature must begin as a standalone library. Libraries must be self-contained, independently testable, documented, and expose clear functionality. No organizational-only libraries; each must serve a specific, justifiable purpose.

### III. API Interface (Adapted from CLI Interface)
While following the Library-First principle, every library exposes functionality via a well-defined API interface. The service provides text-in/out protocol: JSON input/output for structured data exchange, ensuring observability and interoperability. Support both human-readable and JSON formats for debugging and automation.

### IV. Test-First (NON-NEGOTIABLE)
All development follows strict Test-Driven Development. Tests are written first, validated by users, confirmed to fail (Red phase), then implementation proceeds to make tests pass (Green phase). This ensures reliable, specification-driven code generation.

### V. Integration Testing
Focus on integration tests for critical areas: new library contract tests, contract changes, service communication, and shared schemas. Prefer real environments over mocks where possible, ensuring components work together in practice.

### VI. Observability
Implement structured logging and health checks for production monitoring. Use libraries like Pino for JSON logging with request tracing. Expose health endpoints to verify service and dependency status, critical for load balancers and orchestration.

### VII. Versioning & Breaking Changes
API versioning from inception (/v1/) to allow non-breaking evolution. Follow MAJOR.MINOR.BUILD format for releases. Breaking changes require explicit justification, migration plans, and backwards compatibility assessment.

### VIII. Simplicity
Start simple, adhere to YAGNI principles. Avoid over-engineering and speculative features. Use frameworks directly rather than wrapping them unnecessarily. Maximum 3 projects for initial implementation; additional complexity requires documented justification.

### IX. Cost & Performance Management
Implement aggressive caching (Redis) to minimize external API costs and latency. Balance performance vs. freshness tradeoffs with appropriate TTLs. Include rate limiting and monitoring to prevent cost overruns.

## Technology Stack & Architecture

### Framework: NestJS
Core framework providing structured, TypeScript-based architecture with Dependency Injection. Enables easy provider swapping and robust validation/testing tooling.

### External Provider: SmartyStreets
Specialized, CASS-certified provider for reliable address validation. Abstracted via interface to prevent vendor lock-in.

### Caching: Redis
Cache-aside strategy with normalized keys and long TTLs (30-90 days) to reduce costs and improve performance.

### Containerization: Docker & Docker Compose
Ensure consistent environments across development, CI/CD, and production. Single-command local setup.

### Resilience Patterns
Circuit Breaker for provider failures, returning 503 when appropriate. Proper error handling and graceful degradation.

### Language & Ecosystem
Modern 2025 TypeScript ecosystem for type-safe, enterprise-grade application development.

### Locked Technology Stack
The above technology stack is locked for this project. Any changes or additions require explicit justification, constitutional amendment, and assessment of impacts on cost, performance, and maintainability.

## Development Workflow

### Specification-Driven Development (SDD)
Follow SDD methodology where specifications drive implementation, not vice versa. Use structured commands (/specify, /plan, /tasks) to generate complete feature specs, implementation plans, and task lists from natural language descriptions.

### File Creation Order
1. Define API contracts and interfaces
2. Write contract and integration tests
3. Create source code to satisfy tests
4. Implement end-to-end tests
5. Add unit tests for edge cases

### API Documentation and Testing with .http Files
All API endpoints must be documented and tested using .http files (REST Client format). Each API contract shall include:
- .http files for endpoint documentation with example requests/responses
- .http files for each test case to validate request/response behavior
- Support for both human-readable and JSON formats for debugging and automation

### Code Commenting Guidelines
Code comments must focus solely on explaining the "why" and business rules, not implementation details ("how"). Comments should clarify business logic, constraints, and decision rationales that aren't evident from the code itself. Avoid redundant comments that merely restate what the code does; the code is self-documenting for technical implementation.

### Branching & Review
Specifications and plans are team-reviewed, versioned in branches, and merged systematically. Changes propagate through affected components automatically.

## Security & Compliance

Address validation involves sensitive location data. Implement proper authentication, rate limiting, and data privacy measures. Ensure compliance with relevant regulations for address data handling.

## Governance

### Constitutional Supremacy
This constitution supersedes all other practices. All PRs, implementations, and specifications must verify compliance.

### Amendment Process
Modifications require explicit documentation of rationale, review and approval by maintainers, and assessment of backwards compatibility. Amendments are dated and versioned.

### Complexity Tracking
Any violation of simplicity principles (e.g., >3 projects, abstraction layers) must be documented with justification and tracked for future review.

### Research & Validation
Use AI research agents to investigate technical options, performance implications, and organizational constraints during specification development.

**Version**: 1.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15
