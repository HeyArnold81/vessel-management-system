# Billing Events Module

## Purpose

The Billing Events module creates an auditable export queue for finance systems. It does not create invoices inside the Vessel Management System. Instead, it packages completed billable movement-service facts into ERP-ready records that SAP, Oracle, Dynamics, or another finance platform can consume.

This keeps operational activity in the port system and financial posting inside the finance system of record.

## REST API

```text
GET    /api/v1/billing-events
GET    /api/v1/billing-events/:id
POST   /api/v1/billing-events
PATCH  /api/v1/billing-events/:id
DELETE /api/v1/billing-events/:id
```

Supported list features:

- Search by billing event reference.
- Filter by status, movement service, ERP system, and export batch.
- Pagination with `page` and `pageSize`.
- Sorting by reference, status, creation date, or export date.

## Database

The Prisma model `BillingEvent` maps to `billing_events`.

Important columns:

- `eventReference`: Human-friendly export reference, unique per tenant.
- `movementServiceId`: One billing event per billable movement service.
- `status`: Review and export lifecycle state.
- `erpSystem`: Target finance system label such as `SAP` or `ORACLE`.
- `exportBatchId`: Future grouping key for outbound ERP batches.
- `exportedAt`, `acceptedAt`, `rejectedAt`: Integration lifecycle timestamps.
- `failureReason`: ERP rejection or export failure detail.
- `payload`: JSON payload for ERP adapters.

Important indexes:

- `@@unique([tenantId, eventReference])`
- `@@unique([tenantId, movementServiceId])`
- `@@index([tenantId, status, createdAt])`
- `@@index([tenantId, erpSystem, exportedAt])`
- `@@index([exportBatchId])`

## Files Created

### API

- `apps/api/src/modules/billing-events/billing-events.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/billing-events/billing-events.controller.ts`: REST controller for CRUD, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/billing-events/billing-events.service.ts`: Business rules for duplicate prevention, not-found handling, and audit recording.
- `apps/api/src/modules/billing-events/billing-events.repository.ts`: Prisma-backed persistence adapter for billing event queries and mutations.
- `apps/api/src/modules/billing-events/audit.service.ts`: Writes append-only audit records for create, update, and delete operations.
- `apps/api/src/modules/billing-events/billing-event.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/billing-events/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/billing-events/dto/create-billing-event.dto.ts`: Create, update, list, and param validation DTOs.

### Web

- `apps/web/src/app/billing-events/page.tsx`: Next.js route for the Billing Events page.
- `apps/web/src/features/billing-events/api.ts`: Typed Billing Events REST client functions.
- `apps/web/src/features/billing-events/billing-event-form.tsx`: Responsive create/edit form for generating and managing ERP billing events.
- `apps/web/src/features/billing-events/billing-events-page.tsx`: Review queue UI with search, status filtering, pagination, edit, and reject actions.

## Audit Events

- `billing_event.create`
- `billing_event.update`
- `billing_event.delete`

## Current Trade-Off

The first version allows an ERP-ready JSON payload to be stored with the event while keeping searchable operational columns in normal relational fields. This is intentionally pragmatic: SAP and Oracle integrations often require different adapter-specific shapes, but operations still need fast filtering by status, ERP system, batch, and source service.

The next hardening step should generate a richer immutable snapshot from movement, vessel call, vessel, service catalog, port, berth, and customer/bill-to data once Organizations and customer account mapping are built.

## Future Scalability

- Add `BillingExportBatch` to group events into outbound jobs.
- Add connector-specific outbox workers for SAP, Oracle, Dynamics, and generic webhook delivery.
- Add idempotency keys and retry backoff for ERP transmission.
- Add immutable payload versioning so adapters can evolve without breaking historical events.
- Add bill-to account mapping when Organizations and customer contracts are implemented.
- Add operational dashboards for rejected, failed, accepted, and aging unexported billing events.
