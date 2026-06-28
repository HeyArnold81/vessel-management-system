# ADR 0001: Enterprise Architecture Baseline

## Status

Accepted

## Context

The Vessel Management System is intended to become a production-quality, AI-enabled commercial application. It must support local development first, with a clear path to Azure hosting. The system needs a maintainable frontend, a structured backend, PostgreSQL persistence, enterprise authentication through Microsoft Entra ID, local authentication, OAuth support, Docker-based development, and future GraphQL compatibility.

The architecture must avoid early technical debt in authentication, authorization, tenancy, auditability, AI safety, and API boundaries.

## Decision

Use the following baseline architecture:

- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- Backend: NestJS, Node.js, TypeScript.
- API: REST first with OpenAPI documentation; future GraphQL support through a separate transport layer.
- Database: PostgreSQL.
- Data access: Prisma by default, unless later reporting or SQL-control requirements justify Drizzle.
- Authentication: Microsoft Entra ID for enterprise identity, local authentication for controlled fallback, OAuth provider support.
- Authorization: role-based permissions plus resource-level policies.
- Hosting: Docker Compose for local development; Azure Container Apps or Azure App Service later.
- Secrets: local `.env` files for development, Azure Key Vault for deployed environments.
- Observability: structured logging first, Azure Application Insights later.
- AI: backend-only AI integration through a dedicated AI module with permission checks, audit logging, and provider adapters.

## Rationale

NestJS is preferred over raw Express because the application is expected to grow into a modular enterprise system with authentication, audit logging, AI workflows, complex permissions, integrations, background jobs, and reporting. NestJS provides stronger module boundaries, dependency injection, testing conventions, and GraphQL readiness.

REST is preferred for the first release because it is simpler to document, test, secure, and integrate with enterprise clients. GraphQL remains a future option, but must reuse the same application services rather than introducing separate business logic.

PostgreSQL is selected because it is mature, reliable, cloud-friendly, and suitable for relational vessel, crew, compliance, maintenance, audit, and reporting data.

The frontend and backend are separate applications inside a monorepo to keep boundaries clean while allowing shared TypeScript contracts and validation schemas where appropriate.

## Consequences

The system will have more initial structure than a small prototype, but this is appropriate for commercial software. The team must maintain discipline around module boundaries, shared package usage, authentication flows, authorization checks, and migration quality.

Retrofitting multi-tenancy, audit logging, or resource-level permissions later would be expensive. The architecture should account for those from the beginning, even if the first implementation exposes only a smaller feature set.

## Alternatives Considered

### Express Backend

Express is simpler and has less framework overhead, but it provides less architectural guidance. It is not recommended for this system because future complexity is likely.

### GraphQL First

GraphQL can be useful for dashboards and flexible client queries, but it adds avoidable complexity early. REST first is safer for the first production foundation.

### Next.js API Routes Only

Using Next.js as both frontend and backend would reduce the number of services initially, but it would blur application boundaries and make future background jobs, integrations, AI workflows, and enterprise security harder to manage.

### No Local Authentication

Entra-only authentication is attractive for enterprise deployments, but controlled local authentication is useful for development, demos, smaller installations, and break-glass scenarios. Local authentication must still follow strong password hashing and audit requirements.
