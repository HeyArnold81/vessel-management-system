import { ConflictException, NotFoundException } from '@nestjs/common';
import type { BillingEvent, BillingExportBatch, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { BillingExportBatchesRepository } from './billing-export-batches.repository.js';
import { BillingExportBatchesService } from './billing-export-batches.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const batchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const billingEventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const movementServiceId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const payload = {
  erpSystem: 'SAP',
  documentType: 'billing_export_batch',
  version: '1.0',
  billingEventIds: [billingEventId],
  summary: { eventCount: 1 },
} satisfies Prisma.JsonObject;

function buildBatch(overrides: Partial<BillingExportBatch> = {}): BillingExportBatch {
  return {
    id: batchId,
    tenantId,
    batchReference: 'ERP-EXPORT-2026-0001',
    status: 'queued',
    erpSystem: 'SAP',
    externalReference: null,
    eventCount: 1,
    payload,
    requestedAt: new Date('2026-01-01T00:00:00.000Z'),
    completedAt: null,
    failedAt: null,
    failureReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildBillingEvent(): BillingEvent {
  return {
    id: billingEventId,
    tenantId,
    eventReference: 'BILL-2026-0001',
    movementServiceId,
    status: 'ready',
    erpSystem: 'SAP',
    exportBatchId: null,
    exportedAt: null,
    acceptedAt: null,
    rejectedAt: null,
    failureReason: null,
    payload: {
      source: { movementServiceId },
      service: {},
      erp: { documentType: 'billing_request', version: '1.0' },
      snapshot: { movementServiceId },
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
  };
}

function buildRepository(
  overrides: Partial<BillingExportBatchesRepository> = {},
): BillingExportBatchesRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ batches: [buildBatch()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildBatch()),
    findByReference: vi.fn().mockResolvedValue(null),
    findEligibleBillingEvents: vi.fn().mockResolvedValue([buildBillingEvent()]),
    create: vi.fn().mockResolvedValue(buildBatch()),
    update: vi.fn().mockResolvedValue(buildBatch({ status: 'exported', completedAt: new Date() })),
    cancel: vi.fn().mockResolvedValue(buildBatch({ status: 'cancelled', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('BillingExportBatchesService', () => {
  it('returns a paginated export batch list', async () => {
    const service = new BillingExportBatchesService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ batchReference: 'ERP-EXPORT-2026-0001', status: 'queued' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects export creation when billing events are not eligible', async () => {
    const service = new BillingExportBatchesService(
      buildRepository({ findEligibleBillingEvents: vi.fn().mockResolvedValue([]) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, { erpSystem: 'SAP', billingEventIds: [billingEventId] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when an export batch is created', async () => {
    const audit = { record: vi.fn() };
    const service = new BillingExportBatchesService(buildRepository(), audit);

    await service.create(tenantId, { erpSystem: 'SAP', billingEventIds: [billingEventId] });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'billing_export_batch.create',
        entityId: batchId,
      }),
    );
  });

  it('does not cancel exported batches', async () => {
    const service = new BillingExportBatchesService(
      buildRepository({ findById: vi.fn().mockResolvedValue(buildBatch({ status: 'exported' })) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, batchId)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws not found when updating a missing export batch', async () => {
    const service = new BillingExportBatchesService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.update(tenantId, batchId, { status: 'exported' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
