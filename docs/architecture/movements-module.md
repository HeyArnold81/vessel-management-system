# Movements Module

## Purpose

The Movements module records the operational timeline underneath a vessel call. A vessel call is the parent visit file; movements are the timestamped actions or milestones within that visit.

Examples:

- Arrival
- Departure
- Berth shift
- Pilotage
- Towage
- Cargo operation
- Service milestone
- Inspection

## REST API

```text
GET    /api/v1/movements
GET    /api/v1/movements/:id
POST   /api/v1/movements
PATCH  /api/v1/movements/:id
DELETE /api/v1/movements/:id
```

Supported list features:

- Search by movement reference and remarks.
- Filter by status, movement type, vessel call, vessel, and port.
- Pagination with `page` and `pageSize`.
- Sorting by movement reference, planned time, actual time, status, or created date.

## Database

The existing Prisma `VesselMovement` model now functions as the movement timeline entity and maps to `vessel_movements`.

New operational fields:

- `vesselCallId`
- `fromBerthId`
- `toBerthId`
- `plannedAt`
- `actualAt`

Important indexes:

- `@@unique([tenantId, movementReference])`
- `@@index([tenantId, status])`
- `@@index([vesselCallId, plannedAt])`
- `@@index([vesselCallId, actualAt])`

## Files Created

### API

- `apps/api/src/modules/movements/movements.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/movements/movements.controller.ts`: REST controller for CRUD, search, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/movements/movements.service.ts`: Business rules for duplicate movement-reference checks, timeline ordering, not-found behavior, soft delete, and audit recording.
- `apps/api/src/modules/movements/movements.repository.ts`: Prisma-backed persistence adapter for movement queries and mutations.
- `apps/api/src/modules/movements/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/movements/movement.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/movements/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/movements/dto/create-movement.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/movements/dto/update-movement.dto.ts`: Update DTO derived from the create DTO.

### Tests

- `apps/api/src/modules/movements/movements.service.test.ts`: Unit tests for pagination response shape, duplicate reference rejection, time-order validation, audit recording, and not-found delete behavior.
- `apps/api/src/modules/movements/movements.controller.test.ts`: Nest module integration tests for list, create, and tenant boundary behavior.
- `apps/api/src/modules/movements/dto/create-movement.dto.test.ts`: DTO validation tests for movement field rules.
- `apps/web/src/features/movements/movements-page.test.tsx`: Component test proving the Movements page renders API data with parent call context.

### Web

- `apps/web/src/app/movements/page.tsx`: Next.js route for the Movements page.
- `apps/web/src/features/movements/api.ts`: Typed Movements REST client functions.
- `apps/web/src/features/movements/movement-form.tsx`: Responsive create/edit form.
- `apps/web/src/features/movements/movements-page.tsx`: Movement UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.

### Shared

- `packages/shared/src/index.ts`: Adds movement types, statuses, sort fields, create/update contracts, records, and navigation.

## Audit Events

- `movement.create`
- `movement.update`
- `movement.delete`

## Current Trade-Off

The web form derives `vesselId` and `portId` from the selected vessel call. The backend currently stores those values and validates field shapes, duplicate movement references, and timeline order. A future hardening step should add a vessel-call read dependency in the service so the API itself enforces that the submitted vessel and port match the selected vessel call.

## Future Scalability

As movement volume grows, timeline views should query by `vesselCallId`, `plannedAt`, and `actualAt`. For high-volume event history, detailed operational event streams may eventually move to append-only event tables while `VesselMovement` remains the authoritative workflow milestone record.
