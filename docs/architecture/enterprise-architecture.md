# Vessel Management System Enterprise Architecture

## Architecture Overview

```mermaid
flowchart TB
    User[User]
    Browser[Browser]

    subgraph Frontend["Frontend: Next.js"]
        NextApp[React Application]
        UI[Reusable UI Components]
        Features[Feature Modules]
        ApiClient[Typed API Client]
        AuthSession[Auth Session Adapter]
    end

    subgraph Backend["Backend: NestJS"]
        Controllers[REST Controllers]
        AppServices[Application Services]
        Domain[Domain Layer]
        Policies[Authorization Policies]
        Infra[Infrastructure Adapters]
        AiModule[AI Module]
        Jobs[Background Jobs]
    end

    subgraph Data["Data Layer"]
        Postgres[(PostgreSQL)]
        Redis[(Redis: Future Cache and Queues)]
        Blob[(Azure Blob Storage: Future Documents)]
    end

    subgraph Identity["Identity Providers"]
        Entra[Microsoft Entra ID]
        LocalAuth[Local Authentication]
        OAuth[OAuth Providers]
    end

    User --> Browser
    Browser --> NextApp
    NextApp --> Features
    Features --> ApiClient
    AuthSession --> Entra
    ApiClient --> Controllers
    Controllers --> AppServices
    AppServices --> Domain
    AppServices --> Policies
    AppServices --> Infra
    AppServices --> AiModule
    Infra --> Postgres
    Infra --> Redis
    Infra --> Blob
    Controllers --> Identity
```

## Layering

```mermaid
flowchart LR
    UI[Frontend UI Layer]
    API[API Transport Layer]
    Application[Application Layer]
    Domain[Domain Layer]
    Infrastructure[Infrastructure Layer]
    Database[(PostgreSQL)]

    UI --> API
    API --> Application
    Application --> Domain
    Application --> Infrastructure
    Infrastructure --> Database
```

The frontend owns presentation, routing, forms, and client-side interaction. The backend owns business workflows, authorization, validation, persistence orchestration, integrations, audit logging, and AI coordination. The domain layer owns business concepts and rules. Infrastructure owns external systems such as PostgreSQL, storage, identity providers, email, logging, and AI providers.

Business logic must not live in React components, REST controllers, GraphQL resolvers, or database access classes.

## Recommended Repository Structure

```txt
vessel-management-system/
  apps/
    web/
      src/
        app/
        components/
        features/
          auth/
          vessels/
          crew/
          maintenance/
          certificates/
          inspections/
        lib/
          api/
          auth/
          validation/
        styles/
        tests/
      next.config.ts
      tailwind.config.ts
      package.json

    api/
      src/
        main.ts
        app.module.ts
        modules/
          auth/
          users/
          vessels/
          crew/
          maintenance/
          certificates/
          inspections/
          documents/
          audit/
          ai/
          notifications/
        common/
          decorators/
          filters/
          guards/
          interceptors/
          logging/
          validation/
        config/
        database/
          prisma/
            schema.prisma
            migrations/
        tests/
      package.json

  packages/
    shared/
      src/
        constants/
        types/
        validation/
      package.json

  docker/
    api.Dockerfile
    web.Dockerfile
    postgres/

  docs/
    architecture/
    api/
    security/

  docker-compose.yml
  package.json
  tsconfig.base.json
  .env.example
```

The `packages/shared` workspace must stay narrow. It is for stable contracts, shared types, constants, and validation schemas only. It must not become a place for backend business logic or frontend implementation details.

## Component Diagram

```mermaid
flowchart TB
    subgraph Web["Next.js Web App"]
        Routes[Routes and Layouts]
        Components[Design System Components]
        FeatureModules[Feature Modules]
        ClientApi[Typed API Client]
        WebAuth[Auth Session Adapter]
    end

    subgraph Api["NestJS API"]
        Rest[REST Controllers]
        Validation[DTO Validation]
        Services[Application Services]
        Authz[Authorization Policies]
        Models[Domain Models]
        Repositories[Repositories]
        Integrations[External Integrations]
    end

    subgraph Persistence["Persistence"]
        Pg[(PostgreSQL)]
        Audit[(Audit Events)]
    end

    subgraph Providers["External Providers"]
        Entra[Microsoft Entra ID]
        OAuth[OAuth Providers]
        AiProvider[AI Provider]
        Storage[Document Storage]
    end

    Routes --> FeatureModules
    FeatureModules --> Components
    FeatureModules --> ClientApi
    WebAuth --> Entra
    ClientApi --> Rest
    Rest --> Validation
    Rest --> Services
    Services --> Authz
    Services --> Models
    Services --> Repositories
    Services --> Integrations
    Repositories --> Pg
    Services --> Audit
    Integrations --> Providers
```

## Data Flow

Example: creating a vessel maintenance task.

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js Web App
    participant API as NestJS REST API
    participant Guard as Auth Guard
    participant Service as Maintenance Service
    participant Policy as Authorization Policy
    participant DB as PostgreSQL
    participant Audit as Audit Log

    User->>Web: Submit maintenance task
    Web->>API: POST /api/v1/maintenance-tasks
    API->>Guard: Validate session or token
    Guard-->>API: Authenticated principal
    API->>Service: Create maintenance task command
    Service->>Policy: Check vessel-level permission
    Policy-->>Service: Allowed
    Service->>DB: Persist task
    Service->>Audit: Record create event
    DB-->>Service: Created task
    Service-->>API: Response DTO
    API-->>Web: 201 Created
    Web-->>User: Updated task view
```

The frontend may hide unavailable actions, but the backend must always enforce authorization.

## API Strategy

Use versioned REST APIs for the first production foundation:

```txt
/api/v1/auth
/api/v1/users
/api/v1/fleets
/api/v1/vessels
/api/v1/crew
/api/v1/certificates
/api/v1/maintenance-tasks
/api/v1/inspections
/api/v1/documents
/api/v1/audit-events
/api/v1/ai
```

API standards:

- Use OpenAPI documentation generated from the backend.
- Use DTO validation at API boundaries.
- Use pagination, filtering, and sorting for list endpoints.
- Use idempotency keys for critical create/update operations where duplicate submission would be harmful.
- Use correlation IDs for tracing requests.
- Use structured error responses with stable error codes.
- Keep controllers thin and delegate business logic to application services.

Recommended response envelope:

```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```

Recommended error shape:

```json
{
  "error": {
    "code": "VESSEL_NOT_FOUND",
    "message": "Vessel was not found.",
    "details": {}
  }
}
```

### Future GraphQL

GraphQL should be added as a second transport layer only when the product has dashboards or complex client query needs that REST cannot serve cleanly.

```mermaid
flowchart LR
    Rest[REST Controllers] --> App[Application Services]
    Gql[GraphQL Resolvers] --> App
    App --> Domain[Domain Layer]
    App --> Repositories[Repositories]
```

GraphQL resolvers must reuse the same application services as REST controllers.

## Security Model

```mermaid
flowchart TB
    User[User]
    EntraLogin[Microsoft Entra ID]
    LocalLogin[Local Login]
    OAuthLogin[OAuth Login]
    Token[Session or Access Token]
    ApiGuard[NestJS Auth Guard]
    Rbac[Role-Based Permissions]
    Policy[Resource-Level Policies]
    App[Application Service]

    User --> EntraLogin
    User --> LocalLogin
    User --> OAuthLogin
    EntraLogin --> Token
    LocalLogin --> Token
    OAuthLogin --> Token
    Token --> ApiGuard
    ApiGuard --> Rbac
    Rbac --> Policy
    Policy --> App
```

Authentication paths:

- Microsoft Entra ID for enterprise customers.
- Local authentication for development, demos, smaller deployments, and controlled fallback.
- OAuth provider support for future customer identity requirements.

Authorization model:

- Use RBAC for broad capability assignment.
- Use resource-level policies for fleet and vessel access.
- Keep authorization checks on the backend.

Initial roles:

- `SystemAdmin`
- `FleetManager`
- `VesselManager`
- `CrewManager`
- `Inspector`
- `MaintenanceUser`
- `ReadOnlyAuditor`

Initial permission groups:

- `vessel.read`
- `vessel.create`
- `vessel.update`
- `vessel.delete`
- `crew.read`
- `crew.assign`
- `crew.remove`
- `maintenance.read`
- `maintenance.create`
- `maintenance.close`
- `certificate.read`
- `certificate.upload`
- `certificate.approve`
- `audit.read`

Required controls:

- Strong password hashing with Argon2 or bcrypt for local accounts.
- MFA delegated to Microsoft Entra ID where available.
- HTTPS in deployed environments.
- Secure cookies if cookie-backed sessions are used.
- CSRF protection when cookies are used for authentication.
- CORS allowlist.
- Rate limiting.
- Request validation.
- ORM or parameterized SQL access.
- Immutable audit logs for sensitive operations.
- Secrets outside source control.
- Least-privilege database accounts.
- Soft delete for critical business records.
- Application-level resource ownership checks.
- Future PostgreSQL Row Level Security if compliance or tenant isolation requires it.

## Data Architecture

```mermaid
erDiagram
    tenants ||--o{ users : owns
    tenants ||--o{ fleets : owns
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned
    fleets ||--o{ vessels : contains
    vessels ||--o{ crew_assignments : has
    crew_members ||--o{ crew_assignments : assigned
    vessels ||--o{ certificates : has
    vessels ||--o{ maintenance_tasks : has
    vessels ||--o{ inspections : has
    vessels ||--o{ documents : has
    users ||--o{ audit_events : performs

    tenants {
      uuid id
      string name
      timestamp created_at
    }

    users {
      uuid id
      uuid tenant_id
      string email
      string display_name
      string auth_provider
      timestamp created_at
    }

    vessels {
      uuid id
      uuid tenant_id
      uuid fleet_id
      string name
      string imo_number
      string flag
      string status
      timestamp created_at
    }

    maintenance_tasks {
      uuid id
      uuid tenant_id
      uuid vessel_id
      string title
      string status
      string priority
      date due_date
    }

    audit_events {
      uuid id
      uuid tenant_id
      uuid actor_user_id
      string action
      string entity_type
      uuid entity_id
      jsonb metadata
      timestamp created_at
    }
```

Use UUID primary keys from the beginning. Include `tenant_id` early if commercial multi-customer deployment is likely. Retrofitting tenancy after data and authorization logic exist is a major risk.

## Docker And Hosting

Local development should use Docker Compose:

```txt
web       Next.js application
api       NestJS API
postgres  PostgreSQL database
redis     Future cache and queue service
```

Recommended local URLs:

```txt
web:      http://localhost:3000
api:      http://localhost:4000
postgres: localhost:5432
redis:    localhost:6379
```

Future Azure deployment:

```mermaid
flowchart TB
    subgraph Azure["Azure"]
        Web[Next.js Container or Static Web App]
        Api[NestJS API Container]
        Pg[(Azure Database for PostgreSQL)]
        Kv[Azure Key Vault]
        Blob[Azure Blob Storage]
        Insights[Application Insights]
    end

    Web --> Api
    Api --> Pg
    Api --> Kv
    Api --> Blob
    Api --> Insights
```

Use Azure Container Apps or Azure App Service for the API. Choose Azure Static Web Apps only if the frontend deployment model fits the authentication and runtime requirements.

## AI Architecture

```mermaid
flowchart LR
    Web[Frontend] --> Api[Backend API]
    Api --> Ai[AI Module]
    Ai --> Permission[Permission Checks]
    Ai --> Context[Context Builder]
    Context --> Db[(PostgreSQL)]
    Ai --> Provider[AI Provider Adapter]
    Provider --> Model[AI Model]
    Ai --> Audit[AI Audit Log]
```

AI integration rules:

- The frontend must not call AI providers directly.
- Prompts and AI orchestration must live on the backend.
- Permission checks must run before retrieving vessel, crew, document, or compliance context.
- AI usage must be auditable.
- Sensitive data must not be sent to external AI providers unless explicitly allowed by configuration and policy.
- AI output used in operational decisions must be stored with provenance.
- AI suggestions are advisory unless a human explicitly confirms the action.

## Scalability Concerns

Design for these from the start:

- Multi-tenancy.
- Fleet and vessel-level authorization.
- Immutable audit history.
- Large document storage.
- Background jobs.
- AI usage tracking and cost controls.
- Reporting and analytics.
- Data retention policies.
- Customer-specific identity providers.
- Offline or low-connectivity workflows.
- External maritime system integrations.
- PostgreSQL performance under high operational record volume.

## Locked Baseline

This architecture is the accepted baseline for implementation. Changes to these major decisions should be recorded as additional Architecture Decision Records.
