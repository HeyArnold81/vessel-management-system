# Vessels Module

## Scope

The Vessels module is the first full vertical slice of the Vessel Management System. It includes REST API endpoints, validation, search, filtering, pagination, audit logging, React UI, responsive layout, error handling, unit tests, and integration tests.

Delete operations are implemented as soft deletes. This protects operational history and keeps future audit/compliance requirements viable.

## API Endpoints

```txt
GET    /api/v1/vessels
GET    /api/v1/vessels/:id
POST   /api/v1/vessels
PATCH  /api/v1/vessels/:id
DELETE /api/v1/vessels/:id
```

List endpoint query support:

```txt
page
pageSize
search
status
vesselType
sortBy
sortDirection
```

All endpoints currently require an `x-tenant-id` header. This is an explicit temporary tenant boundary until full authentication and authorization are implemented.

## File Map

### API App

- `apps/api/package.json`: Defines the NestJS API workspace package, scripts, and runtime dependencies.
- `apps/api/tsconfig.json`: TypeScript configuration for compiling the API as a Node-compatible app package.
- `apps/api/src/main.ts`: API bootstrap. Configures CORS, global `/api` prefix, validation, error filter, and OpenAPI docs.
- `apps/api/src/app.module.ts`: Root NestJS module that wires database and Vessels modules.
- `apps/api/src/database/database.module.ts`: Exposes Prisma database access to API modules.
- `apps/api/src/database/prisma.service.ts`: Nest-managed Prisma client lifecycle.
- `apps/api/src/shared/api-exception.filter.ts`: Normalizes API errors into a stable error envelope.

### Vessels API Module

- `apps/api/src/modules/vessels/vessels.module.ts`: Wires the Vessels controller, service, repository, and audit dependency.
- `apps/api/src/modules/vessels/vessels.controller.ts`: REST controller for CRUD, search, filtering, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/vessels/vessels.service.ts`: Business rules for duplicate IMO checks, not-found handling, soft delete, and audit recording.
- `apps/api/src/modules/vessels/vessels.repository.ts`: Prisma-backed persistence adapter for vessel queries and mutations.
- `apps/api/src/modules/vessels/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/vessels/vessel.mapper.ts`: Converts Prisma vessel records into API-safe DTO records.
- `apps/api/src/modules/vessels/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/vessels/dto/create-vessel.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/vessels/dto/update-vessel.dto.ts`: Update DTO derived from the create DTO.

### API Tests

- `apps/api/src/modules/vessels/vessels.service.test.ts`: Unit tests for pagination response shape, duplicate IMO rejection, audit recording, and not-found delete behavior.
- `apps/api/src/modules/vessels/vessels.controller.test.ts`: HTTP integration tests for list, create, and normalized tenant error handling.
- `apps/api/src/modules/vessels/dto/create-vessel.dto.test.ts`: DTO validation tests for vessel field rules.

### Web App

- `apps/web/src/app/vessels/page.tsx`: Next.js route for the Vessels page.
- `apps/web/src/lib/api/http.ts`: Shared browser API client with tenant header, JSON handling, and normalized API error mapping.
- `apps/web/src/features/vessels/api.ts`: Typed Vessels REST client functions.
- `apps/web/src/features/vessels/vessel-form.tsx`: Responsive create/edit form with browser-level validation.
- `apps/web/src/features/vessels/vessels-page.tsx`: Vessels UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.
- `apps/web/src/features/vessels/vessels-page.test.tsx`: Component test proving the Vessels page renders data returned by the REST client.

### Shared Contracts

- `packages/shared/src/index.ts`: Adds Vessels shared types, query contracts, response envelope types, statuses, vessel types, and sortable fields.

### Infrastructure

- `docker/api.Dockerfile`: Production container build for the NestJS API.
- `docker-compose.yml`: Adds the API service on port `4000` alongside PostgreSQL and the web app.
- `.env.example`: Adds API port, web origin, and public API URL configuration.
- `tsconfig.base.json`: Enables decorator metadata required by NestJS.
- `tsconfig.json`: Registers the API app as a first-class TypeScript project reference.
- `vitest.config.ts`: Adds aliases for app and package imports used by tests.
- `package.json`: Adds API scripts, NestJS dependencies, test dependencies, and safe dependency overrides.

## Validation

Validation is enforced at the API boundary with `class-validator` DTOs:

- `name`: 2 to 120 characters.
- `imoNumber`: exactly seven digits.
- `mmsi`: optional, exactly nine digits.
- `callSign`: optional, 3 to 12 characters.
- `vesselType`: one of the approved shared vessel types.
- numeric dimensions and tonnage must be positive and within sensible limits.
- `status`: `active` or `inactive`.

## Audit Logging

Audit records are written for:

- `vessel.create`
- `vessel.update`
- `vessel.delete`

Each audit event stores tenant id, entity id, action, before/after data where applicable, and source metadata.

## Future Work

- Replace temporary `x-tenant-id` with authenticated tenant context.
- Add authorization policies for vessel-level access.
- Add database-backed integration tests with disposable PostgreSQL containers.
- Add Prisma migrations once the first deployable database baseline is ready.
- Add owner/operator/agent relationships after the Organizations module lands.
