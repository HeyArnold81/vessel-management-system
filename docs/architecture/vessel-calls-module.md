# Vessel Calls Module

## Purpose

The Vessel Calls module represents a vessel's visit to a port. It is the operational parent record for future arrivals, departures, berth shifts, pilotage, towage, cargo operations, services, events, and invoicing.

This module deliberately models a vessel call separately from detailed movement events. A call answers "what visit are we managing?" while future movements answer "what happened during that visit?"

## REST API

```text
GET    /api/v1/vessel-calls
GET    /api/v1/vessel-calls/:id
POST   /api/v1/vessel-calls
PATCH  /api/v1/vessel-calls/:id
DELETE /api/v1/vessel-calls/:id
```

Supported list features:

- Search by call reference, voyage number, and remarks.
- Filter by status, vessel, port, and berth.
- Pagination with `page` and `pageSize`.
- Sorting by call reference, ETA, ETD, status, or created date.

## Database

The Prisma model `VesselCall` maps to `vessel_calls`.

Important constraints and indexes:

- `@@unique([tenantId, callReference])` prevents duplicate operational references inside a tenant.
- `@@index([tenantId, status, eta])` supports planning boards and status queues.
- `@@index([vesselId, eta])` supports vessel visit history.
- `@@index([portId, eta])` supports port schedule views.
- `@@index([berthId, eta])` prepares for berth planning.

## Files Created

### API

- `apps/api/src/modules/vessel-calls/vessel-calls.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/vessel-calls/vessel-calls.controller.ts`: REST controller for CRUD, search, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/vessel-calls/vessel-calls.service.ts`: Business rules for duplicate call-reference checks, date ordering, not-found behavior, soft delete, and audit recording.
- `apps/api/src/modules/vessel-calls/vessel-calls.repository.ts`: Prisma-backed persistence adapter for vessel-call queries and mutations.
- `apps/api/src/modules/vessel-calls/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/vessel-calls/vessel-call.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/vessel-calls/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/vessel-calls/dto/create-vessel-call.dto.ts`: Create/list/param validation DTOs using class-validator and Swagger metadata.
- `apps/api/src/modules/vessel-calls/dto/update-vessel-call.dto.ts`: Update DTO derived from the create DTO.

### Tests

- `apps/api/src/modules/vessel-calls/vessel-calls.service.test.ts`: Unit tests for pagination response shape, duplicate reference rejection, date-order validation, audit recording, and not-found delete behavior.
- `apps/api/src/modules/vessel-calls/vessel-calls.controller.test.ts`: Nest module integration tests for list, create, and tenant boundary behavior.
- `apps/api/src/modules/vessel-calls/dto/create-vessel-call.dto.test.ts`: DTO validation tests for vessel-call field rules.
- `apps/web/src/features/vessel-calls/vessel-calls-page.test.tsx`: Component test proving the page renders vessel calls with vessel and port context.

### Web

- `apps/web/src/app/vessel-calls/page.tsx`: Next.js route for the Vessel Calls page.
- `apps/web/src/features/vessel-calls/api.ts`: Typed Vessel Calls REST client functions.
- `apps/web/src/features/vessel-calls/vessel-call-form.tsx`: Responsive create/edit form with vessel and port pickers.
- `apps/web/src/features/vessel-calls/vessel-calls-page.tsx`: Vessel Calls UI containing search, filtering, pagination, CRUD actions, loading states, empty state, and error display.

### Shared

- `packages/shared/src/index.ts`: Adds vessel-call types, statuses, sort fields, create/update contracts, and navigation.

## Audit Events

- `vessel_call.create`
- `vessel_call.update`
- `vessel_call.delete`

## Current Trade-Off

Agent, operator, and berth values are stored on the call, but the current UI only has full pickers for vessels and ports because Organizations and richer berth scheduling are not yet complete application modules. Once those modules mature, agent/operator should become searchable organization pickers and berth should become a constrained berth selector filtered by the selected port.

## Next Step

The next module should add detailed movement events linked to `VesselCall`, such as arrival, pilot boarded, tug assigned, berth shift, alongside, cargo operations started/completed, cast off, and departure. This should not replace the vessel call; it should form a child timeline under it.
