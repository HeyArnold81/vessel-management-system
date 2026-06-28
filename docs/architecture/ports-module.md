# Ports Module

## Scope

The Ports module is a full vertical slice for port master data. It includes REST API endpoints, validation, search, filtering, pagination, audit logging, React UI, responsive layout, error handling, unit tests, and integration tests.

Terminals and berths are intentionally not included in this slice. They are child modules of Ports and should be built next as separate, focused slices.

## API Endpoints

```txt
GET    /api/v1/ports
GET    /api/v1/ports/:id
POST   /api/v1/ports
PATCH  /api/v1/ports/:id
DELETE /api/v1/ports/:id
```

List endpoint query support:

```txt
page
pageSize
search
status
countryId
sortBy
sortDirection
```

All endpoints currently require an `x-tenant-id` header. This remains a temporary tenant boundary until full authentication and authorization are implemented.

## File Map

### Ports API Module

- `apps/api/src/modules/ports/ports.module.ts`: Wires the Ports controller, service, repository, and audit dependency.
- `apps/api/src/modules/ports/ports.controller.ts`: REST controller for CRUD, search, filtering, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/ports/ports.service.ts`: Business rules for duplicate UN/LOCODE checks, not-found handling, soft delete, and audit recording.
- `apps/api/src/modules/ports/ports.repository.ts`: Prisma-backed persistence adapter for port queries and mutations.
- `apps/api/src/modules/ports/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/ports/port.mapper.ts`: Converts Prisma port records into API-safe DTO records.
- `apps/api/src/modules/ports/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/ports/dto/create-port.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/ports/dto/update-port.dto.ts`: Update DTO derived from the create DTO.

### API Tests

- `apps/api/src/modules/ports/ports.service.test.ts`: Unit tests for pagination response shape, duplicate UN/LOCODE rejection, audit recording, and not-found delete behavior.
- `apps/api/src/modules/ports/ports.controller.test.ts`: HTTP integration tests for list, create, and normalized tenant error handling.
- `apps/api/src/modules/ports/dto/create-port.dto.test.ts`: DTO validation tests for port field rules.

### Web App

- `apps/web/src/app/ports/page.tsx`: Next.js route for the Ports page.
- `apps/web/src/features/ports/api.ts`: Typed Ports REST client functions.
- `apps/web/src/features/ports/port-form.tsx`: Responsive create/edit form with browser-level validation.
- `apps/web/src/features/ports/ports-page.tsx`: Ports UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.
- `apps/web/src/features/ports/ports-page.test.tsx`: Component test proving the Ports page renders data returned by the REST client.

### Shared Contracts

- `packages/shared/src/index.ts`: Adds Ports shared types, query contracts, statuses, sortable fields, and create/update inputs.

### App Registration

- `apps/api/src/app.module.ts`: Registers the Ports module with the NestJS API.

## Validation

Validation is enforced at the API boundary with `class-validator` DTOs:

- `countryId`: required valid UUID.
- `unlocode`: five uppercase characters, matching UN/LOCODE style.
- `name`: 2 to 160 characters.
- `timeZone`: 3 to 80 characters.
- `status`: `active` or `inactive`.

## Audit Logging

Audit records are written for:

- `port.create`
- `port.update`
- `port.delete`

Each audit event stores tenant id, entity id, action, before/after data where applicable, and source metadata.

## Current Trade-Off

Ports require `countryId` because the normalized schema correctly requires a country relationship. The current UI exposes `countryId` directly because the Countries/reference-data selector has not been built yet.

This is acceptable for the first module slice, but it should not remain the final user experience. The next refinement should add a Reference Data or Countries module so users can select a country by name or ISO code rather than entering a UUID.

## Future Work

- Replace direct `countryId` entry with a country selector.
- Replace temporary `x-tenant-id` with authenticated tenant context.
- Add authorization policies for port-level access.
- Add database-backed integration tests with disposable PostgreSQL containers.
- Build Terminals as the next child module.
- Build Berths after Terminals.
