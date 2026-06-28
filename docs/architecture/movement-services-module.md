# Movement Services Module

## Purpose

The Movement Services module attaches performed or requested marine services to vessel movements. It is the operational-to-billing bridge: the app records service facts, then a future Billing Events module can package completed billable services for ERP export.

## REST API

```text
GET    /api/v1/movement-services
GET    /api/v1/movement-services/:id
POST   /api/v1/movement-services
PATCH  /api/v1/movement-services/:id
DELETE /api/v1/movement-services/:id
```

Supported list features:

- Filter by movement, service, provider, status, and billable flag.
- Pagination with `page` and `pageSize`.
- Sorting by status, requested time, completed time, or created date.

## Database

The Prisma model `MovementService` maps to `movement_services`.

New billing-enablement fields:

- `requestedAt`
- `completedAt`
- `isBillable`

Important indexes:

- `@@index([movementId])`
- `@@index([providerOrganizationId, status])`
- `@@index([tenantId, status])`
- `@@index([tenantId, isBillable, completedAt])`

## Files Created

### API

- `apps/api/src/modules/movement-services/movement-services.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/movement-services/movement-services.controller.ts`: REST controller for CRUD, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/movement-services/movement-services.service.ts`: Business rules for not-found behavior, requested/completed time ordering, cancellation, and audit recording.
- `apps/api/src/modules/movement-services/movement-services.repository.ts`: Prisma-backed persistence adapter for movement-service queries and mutations.
- `apps/api/src/modules/movement-services/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/movement-services/movement-service.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/movement-services/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/movement-services/dto/create-movement-service.dto.ts`: Create/list/param validation DTOs.
- `apps/api/src/modules/movement-services/dto/update-movement-service.dto.ts`: Update DTO derived from the create DTO.

### Web

- `apps/web/src/app/movement-services/page.tsx`: Next.js route for the Movement Services page.
- `apps/web/src/features/movement-services/api.ts`: Typed Movement Services REST client functions.
- `apps/web/src/features/movement-services/movement-service-form.tsx`: Responsive create/edit form.
- `apps/web/src/features/movement-services/movement-services-page.tsx`: UI for attaching catalog services to movements and tracking billing-ready facts.

## Audit Events

- `movement_service.create`
- `movement_service.update`
- `movement_service.delete`

## Current Trade-Off

Provider is currently an optional organization ID field because the Organizations module and provider picker are not yet built. The database relationship is ready; the UI should become a searchable provider selector once Organizations exists.

## Billing Strategy

This module does not create invoices. It records reliable, auditable operational service facts. The next module should generate immutable Billing Events from completed, billable movement services and prepare ERP-friendly payloads for SAP, Oracle, Dynamics, or other finance systems.
