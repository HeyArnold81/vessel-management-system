# Berths Module

## Scope

The Berths module is a full vertical slice for berth master data. It includes REST API endpoints, validation, search, filtering, pagination, audit logging, React UI, responsive layout, error handling, unit tests, integration tests, and file-by-file documentation.

Berths belong to terminals. Because the Terminals module has not been built yet, this slice exposes `terminalId` directly while preserving the normalized database relationship.

## API Endpoints

```txt
GET    /api/v1/berths
GET    /api/v1/berths/:id
POST   /api/v1/berths
PATCH  /api/v1/berths/:id
DELETE /api/v1/berths/:id
```

List endpoint query support:

```txt
page
pageSize
search
status
terminalId
sortBy
sortDirection
```

All endpoints currently require an `x-tenant-id` header. This remains a temporary tenant boundary until full authentication and authorization are implemented.

## File Map

### Berths API Module

- `apps/api/src/modules/berths/berths.module.ts`: Wires the Berths controller, service, repository, and audit dependency.
- `apps/api/src/modules/berths/berths.controller.ts`: REST controller for CRUD, search, filtering, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/berths/berths.service.ts`: Business rules for duplicate berth-code checks within a terminal, not-found handling, soft delete, and audit recording.
- `apps/api/src/modules/berths/berths.repository.ts`: Prisma-backed persistence adapter for berth queries and mutations.
- `apps/api/src/modules/berths/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/berths/berth.mapper.ts`: Converts Prisma berth records into API-safe DTO records.
- `apps/api/src/modules/berths/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/berths/dto/create-berth.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/berths/dto/update-berth.dto.ts`: Update DTO derived from the create DTO.

### API Tests

- `apps/api/src/modules/berths/berths.service.test.ts`: Unit tests for pagination response shape, duplicate code rejection, audit recording, and not-found delete behavior.
- `apps/api/src/modules/berths/berths.controller.test.ts`: Nest module integration tests for list, create, and tenant boundary behavior.
- `apps/api/src/modules/berths/dto/create-berth.dto.test.ts`: DTO validation tests for berth field rules.

### Web App

- `apps/web/src/app/berths/page.tsx`: Next.js route for the Berths page.
- `apps/web/src/features/berths/api.ts`: Typed Berths REST client functions.
- `apps/web/src/features/berths/berth-form.tsx`: Responsive create/edit form with browser-level validation.
- `apps/web/src/features/berths/berths-page.tsx`: Berths UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.
- `apps/web/src/features/berths/berths-page.test.tsx`: Component test proving the Berths page renders data returned by the REST client.

### Shared Contracts

- `packages/shared/src/index.ts`: Adds Berths shared types, query contracts, statuses, sortable fields, create/update inputs, and navigation entry.

### App Registration

- `apps/api/src/app.module.ts`: Registers the Berths module with the NestJS API.

## Validation

Validation is enforced at the API boundary with `class-validator` DTOs:

- `terminalId`: required valid UUID.
- `code`: required, 1 to 40 characters.
- `name`: required, 2 to 120 characters.
- `maxLengthM`: optional, 1 to 600 metres.
- `maxDraftM`: optional, 0.1 to 40 metres.
- `status`: `active` or `inactive`.

## Audit Logging

Audit records are written for:

- `berth.create`
- `berth.update`
- `berth.delete`

Each audit event stores tenant id, entity id, action, before/after data where applicable, and source metadata.

## Current Trade-Off

Berths require `terminalId` because the normalized schema correctly requires a terminal relationship. The current UI exposes `terminalId` directly because the Terminals module and selector have not been built yet.

This should not remain the final user experience. Once Terminals is implemented, the Berths form should use a terminal selector filtered by port and tenant.

## Future Work

- Replace direct `terminalId` entry with a terminal selector.
- Replace temporary `x-tenant-id` with authenticated tenant context.
- Add authorization policies for terminal and berth-level access.
- Add database-backed integration tests with disposable PostgreSQL containers.
- Add berth availability/conflict checks when movement berth stays are implemented.
