# Services Module

## Purpose

The Services module manages the marine service catalog. It is master data for services that can later be requested, performed, billed, and invoiced against vessel movements.

Examples:

- Pilotage
- Towage
- Mooring
- Waste disposal
- Fresh water
- Bunkering
- Stores
- Security
- Inspections
- Agency attendance

## REST API

```text
GET    /api/v1/services
GET    /api/v1/services/:id
POST   /api/v1/services
PATCH  /api/v1/services/:id
DELETE /api/v1/services/:id
```

Supported list features:

- Search by service name, code, and default unit.
- Filter by status, category, and billable flag.
- Pagination with `page` and `pageSize`.
- Sorting by name, code, category, status, or created date.

## Database

The Prisma model `ServiceCatalog` maps to `service_catalog`.

Important fields:

- `code`
- `name`
- `category`
- `defaultUnit`
- `isBillable`
- `status`
- `deletedAt`

Important constraints and indexes:

- `@@unique([tenantId, code])`
- `@@index([tenantId, category])`
- `@@index([tenantId, status])`

## Files Created

### API

- `apps/api/src/modules/services/services.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/services/service-catalog.controller.ts`: REST controller for CRUD, search, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/services/service-catalog.service.ts`: Business rules for duplicate service-code checks, not-found behavior, soft delete, and audit recording.
- `apps/api/src/modules/services/service-catalog.repository.ts`: Prisma-backed persistence adapter for service catalog queries and mutations.
- `apps/api/src/modules/services/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/services/service-catalog.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/services/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/services/dto/create-service-catalog.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/services/dto/update-service-catalog.dto.ts`: Update DTO derived from the create DTO.

### Tests

- `apps/api/src/modules/services/service-catalog.service.test.ts`: Unit tests for pagination response shape, duplicate code rejection, audit recording, and not-found delete behavior.
- `apps/api/src/modules/services/service-catalog.controller.test.ts`: Nest module integration tests for list, create, and tenant boundary behavior.
- `apps/api/src/modules/services/dto/create-service-catalog.dto.test.ts`: DTO validation tests for service field rules.
- `apps/web/src/features/services/services-page.test.tsx`: Component test proving the Services page renders API data.

### Web

- `apps/web/src/app/services/page.tsx`: Next.js route for the Services page.
- `apps/web/src/features/services/api.ts`: Typed Services REST client functions.
- `apps/web/src/features/services/service-form.tsx`: Responsive create/edit form.
- `apps/web/src/features/services/services-page.tsx`: Services UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.

### Shared

- `packages/shared/src/index.ts`: Adds service catalog types, categories, statuses, sort fields, create/update contracts, and records.

## Audit Events

- `service_catalog.create`
- `service_catalog.update`
- `service_catalog.delete`

## Current Trade-Off

This module only manages the controlled catalog. It does not yet attach services to movements. That next module should use `MovementService` to record requested/performed work against a movement, including provider, quantity, unit, status, requested time, completed time, and later invoice linkage.

## Future Scalability

For commercial use, service catalog entries should eventually support pricing rules, tax categories, port-specific availability, provider-specific rates, and effective-dated tariffs. Those should be modeled separately from the catalog item so historical invoices remain reproducible.
