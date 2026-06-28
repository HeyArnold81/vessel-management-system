# Cargo Catalog Module

## Scope

The Cargo Catalog module is a full vertical slice for cargo master data. It includes REST API endpoints, validation, search, filtering, pagination, audit logging, React UI, responsive layout, error handling, unit tests, integration tests, and file-by-file documentation.

This module intentionally covers cargo master data only. Movement cargo records should be built later after Movements/Port Calls exist.

## Schema Change

`CargoItem` now includes:

- `status`
- `deletedAt`

This aligns Cargo with Vessels, Ports, and Berths so the module supports active/inactive filtering and soft delete.

## API Endpoints

```txt
GET    /api/v1/cargo-items
GET    /api/v1/cargo-items/:id
POST   /api/v1/cargo-items
PATCH  /api/v1/cargo-items/:id
DELETE /api/v1/cargo-items/:id
```

List endpoint query support:

```txt
page
pageSize
search
status
cargoCategory
isHazardous
sortBy
sortDirection
```

All endpoints currently require an `x-tenant-id` header. This remains a temporary tenant boundary until full authentication and authorization are implemented.

## File Map

### Cargo API Module

- `apps/api/src/modules/cargo/cargo.module.ts`: Wires the Cargo controller, service, repository, and audit dependency.
- `apps/api/src/modules/cargo/cargo-items.controller.ts`: REST controller for CRUD, search, filtering, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/cargo/cargo-items.service.ts`: Business rules for duplicate cargo-code checks, not-found handling, soft delete, and audit recording.
- `apps/api/src/modules/cargo/cargo-items.repository.ts`: Prisma-backed persistence adapter for cargo catalog queries and mutations.
- `apps/api/src/modules/cargo/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/cargo/cargo-item.mapper.ts`: Converts Prisma cargo records into API-safe DTO records.
- `apps/api/src/modules/cargo/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/cargo/dto/create-cargo-item.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/cargo/dto/update-cargo-item.dto.ts`: Update DTO derived from the create DTO.

### API Tests

- `apps/api/src/modules/cargo/cargo-items.service.test.ts`: Unit tests for pagination response shape, duplicate code rejection, audit recording, and not-found delete behavior.
- `apps/api/src/modules/cargo/cargo-items.controller.test.ts`: Nest module integration tests for list, create, and tenant boundary behavior.
- `apps/api/src/modules/cargo/dto/create-cargo-item.dto.test.ts`: DTO validation tests for cargo field rules.

### Web App

- `apps/web/src/app/cargo/page.tsx`: Next.js route for the Cargo page.
- `apps/web/src/features/cargo/api.ts`: Typed Cargo REST client functions.
- `apps/web/src/features/cargo/cargo-form.tsx`: Responsive create/edit form with browser-level validation.
- `apps/web/src/features/cargo/cargo-page.tsx`: Cargo UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.
- `apps/web/src/features/cargo/cargo-page.test.tsx`: Component test proving the Cargo page renders data returned by the REST client.

### Shared Contracts

- `packages/shared/src/index.ts`: Adds Cargo shared types, query contracts, statuses, categories, sortable fields, create/update inputs, and navigation entry.

### App Registration

- `apps/api/src/app.module.ts`: Registers the Cargo module with the NestJS API.

### Database

- `packages/database/prisma/schema.prisma`: Adds `status`, `deletedAt`, and status index to `CargoItem`.

## Validation

Validation is enforced at the API boundary with `class-validator` DTOs:

- `cargoCode`: required, 2 to 40 characters, uppercase letters/numbers/hyphens.
- `name`: required, 2 to 160 characters.
- `cargoCategory`: one of `bulk`, `container`, `general`, `hazardous`, `liquid`, `reefer`.
- `unNumber`: optional four-digit UN number.
- `isHazardous`: optional boolean.
- `status`: `active` or `inactive`.

## Audit Logging

Audit records are written for:

- `cargo_item.create`
- `cargo_item.update`
- `cargo_item.delete`

Each audit event stores tenant id, entity id, action, before/after data where applicable, and source metadata.

## Current Trade-Off

Cargo movement records are not included in this slice. That is deliberate: movement cargo needs a real movement/port-call module first. Building movement cargo now would force fake dependencies and weaken the domain model.

## Future Work

- Build Movement/Port Call module.
- Add Movement Cargo as an operational child module.
- Add hazardous cargo compliance fields if required.
- Replace temporary `x-tenant-id` with authenticated tenant context.
- Add authorization policies for cargo catalog maintenance.
- Add database-backed integration tests with disposable PostgreSQL containers.
