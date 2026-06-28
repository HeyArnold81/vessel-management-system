import { ConflictException, NotFoundException } from '@nestjs/common';
import type { BillingEvent } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { BillingEventsRepository } from './billing-events.repository.js';
import { BillingEventsService } from './billing-events.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const billingEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const movementServiceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const payload = {
  source: { movementServiceId },
  service: { quantity: '1', unitOfMeasure: 'job', isBillable: true },
  erp: { documentType: 'billing_request', version: '1.0' },
  snapshot: { movementServiceId },
} as const;

function buildBillingEvent(overrides: Partial<BillingEvent> = {}): BillingEvent {
  return {
    id: billingEventId,
    tenantId,
    eventReference: 'BILL-2026-0001',
    movementServiceId,
    status: 'draft',
    erpSystem: 'SAP',
    exportBatchId: null,
    exportedAt: null,
    acceptedAt: null,
    rejectedAt: null,
    failureReason: null,
    payload,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(
  overrides: Partial<BillingEventsRepository> = {},
): BillingEventsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ billingEvents: [buildBillingEvent()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildBillingEvent()),
    findByMovementServiceId: vi.fn().mockResolvedValue(null),
    findByEventReference: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildBillingEvent()),
    update: vi.fn().mockResolvedValue(buildBillingEvent({ status: 'ready' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildBillingEvent({ status: 'rejected', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('BillingEventsService', () => {
  it('returns a paginated billing event list', async () => {
    const service = new BillingEventsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ eventReference: 'BILL-2026-0001', status: 'draft' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate billing events for the same movement service', async () => {
    const service = new BillingEventsService(
      buildRepository({ findByMovementServiceId: vi.fn().mockResolvedValue(buildBillingEvent()) }),
      { record: vi.fn() },
    );

    await expect(service.create(tenantId, { movementServiceId })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('records an audit event when billing event is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new BillingEventsService(buildRepository(), audit);

    await service.update(tenantId, billingEventId, { status: 'ready' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'billing_event.update',
        entityId: billingEventId,
      }),
    );
  });

  it('throws not found when rejecting a missing billing event', async () => {
    const service = new BillingEventsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, billingEventId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
