# Billing Export Batches Module

## Purpose

The Billing Export Batches module groups ready Billing Events into outbound ERP packages. It is an integration foundation, not an invoicing module. The Vessel Management System remains the operational source of truth, while SAP, Oracle, Dynamics, or another finance platform remains responsible for invoice creation, tax handling, ledger posting, and finance approvals.

## REST API

```text
GET    /api/v1/billing-export-batches
GET    /api/v1/billing-export-batches/:id
POST   /api/v1/billing-export-batches
PATCH  /api/v1/billing-export-batches/:id
DELETE /api/v1/billing-export-batches/:id
```

Supported list features:

- Search by batch reference.
- Filter by status and ERP system.
- Pagination with `page` and `pageSize`.
- Sorting by reference, status, requested date, or completed date.

## Database

The Prisma model `BillingExportBatch` maps to `billing_export_batches`.

Important columns:

- `batchReference`: Human-friendly export batch reference, unique per tenant.
- `status`: Export lifecycle state.
- `erpSystem`: Target finance platform label such as `SAP` or `ORACLE`.
- `externalReference`: Future ERP document, job, or correlation reference.
- `eventCount`: Number of Billing Events included in the batch.
- `payload`: JSON payload summary for ERP adapters.
- `requestedAt`, `completedAt`, `failedAt`: Lifecycle timestamps.
- `failureReason`: ERP rejection or export failure detail.

Important indexes:

- `@@unique([tenantId, batchReference])`
- `@@index([tenantId, status, requestedAt])`
- `@@index([tenantId, erpSystem, requestedAt])`
- `@@index([externalReference])`

## Files Created

### API

- `apps/api/src/modules/billing-export-batches/billing-export-batches.module.ts`: Wires the controller, service, repository, and audit dependency.
- `apps/api/src/modules/billing-export-batches/billing-export-batches.controller.ts`: REST controller for batch CRUD, filtering, sorting, pagination, and tenant boundary enforcement.
- `apps/api/src/modules/billing-export-batches/billing-export-batches.service.ts`: Business rules for eligible Billing Events, duplicate references, cancellation, and audit recording.
- `apps/api/src/modules/billing-export-batches/billing-export-batches.repository.ts`: Prisma-backed persistence adapter for batch queries, mutations, and event assignment.
- `apps/api/src/modules/billing-export-batches/audit.service.ts`: Writes append-only audit records for create, update, and cancel operations.
- `apps/api/src/modules/billing-export-batches/billing-export-batch.mapper.ts`: Converts Prisma records into API-safe DTO records.
- `apps/api/src/modules/billing-export-batches/tenant-context.ts`: Validates the temporary `x-tenant-id` request boundary.
- `apps/api/src/modules/billing-export-batches/dto/create-billing-export-batch.dto.ts`: Create, update, list, and param validation DTOs.

### Web

- `apps/web/src/app/billing-export-batches/page.tsx`: Next.js route for the ERP Export Batches page.
- `apps/web/src/features/billing-export-batches/api.ts`: Typed Billing Export Batches REST client functions.
- `apps/web/src/features/billing-export-batches/billing-export-batches-page.tsx`: UI for selecting ready Billing Events, creating export batches, and reviewing export lifecycle state.

## Audit Events

- `billing_export_batch.create`
- `billing_export_batch.update`
- `billing_export_batch.cancel`

## Current Trade-Off

This module records export intent and lifecycle state, but it does not yet transmit to an ERP endpoint. That is deliberate. The correct next layer is an outbox worker and connector adapter model, because real ERP integrations need retries, idempotency, credentials, payload mapping, response capture, and dead-letter handling.

## Future Scalability

- Add ERP connector configuration per tenant and ERP system.
- Add an outbox table for async delivery jobs.
- Add idempotency keys per batch and per Billing Event.
- Add adapter-specific response logs for SAP, Oracle, Dynamics, and generic webhook delivery.
- Add retry backoff, dead-letter state, and operational requeue controls.
- Add secure credential storage with Azure Key Vault when hosted in Azure.
