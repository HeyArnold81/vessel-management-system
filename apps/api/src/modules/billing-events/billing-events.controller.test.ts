import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { BillingEvent } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { BillingEventsController } from './billing-events.controller.js';
import {
  BILLING_EVENTS_REPOSITORY,
  type BillingEventsRepository,
} from './billing-events.repository.js';
import { BILLING_EVENT_AUDIT_RECORDER, BillingEventsService } from './billing-events.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const billingEventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const movementServiceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

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
    payload: {
      source: { movementServiceId },
      service: {},
      erp: { documentType: 'billing_request', version: '1.0' },
      snapshot: { movementServiceId },
    },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

class InMemoryBillingEventsRepository implements BillingEventsRepository {
  private billingEvents = [buildBillingEvent()];

  async findPage(): Promise<{ billingEvents: readonly BillingEvent[]; totalItems: number }> {
    return { billingEvents: this.billingEvents, totalItems: this.billingEvents.length };
  }

  async findById(_tenantId: string, id: string): Promise<BillingEvent | null> {
    return this.billingEvents.find((event) => event.id === id && event.deletedAt === null) ?? null;
  }

  async findByMovementServiceId(
    _tenantId: string,
    sourceMovementServiceId: string,
  ): Promise<BillingEvent | null> {
    return (
      this.billingEvents.find((event) => event.movementServiceId === sourceMovementServiceId) ??
      null
    );
  }

  async findByEventReference(
    _tenantId: string,
    eventReference: string,
  ): Promise<BillingEvent | null> {
    return this.billingEvents.find((event) => event.eventReference === eventReference) ?? null;
  }

  async create(tenant: string, input: { movementServiceId: string }): Promise<BillingEvent> {
    const event = buildBillingEvent({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      tenantId: tenant,
      eventReference: 'BILL-2026-0002',
      movementServiceId: input.movementServiceId,
    });
    this.billingEvents.push(event);
    return event;
  }

  async update(): Promise<BillingEvent> {
    return buildBillingEvent({ status: 'ready' });
  }

  async softDelete(): Promise<BillingEvent> {
    return buildBillingEvent({
      status: 'rejected',
      deletedAt: new Date('2026-01-03T00:00:00.000Z'),
    });
  }
}

describe('BillingEventsController integration', () => {
  let controller: BillingEventsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BillingEventsController],
      providers: [
        BillingEventsService,
        { provide: BILLING_EVENTS_REPOSITORY, useClass: InMemoryBillingEventsRepository },
        { provide: BILLING_EVENT_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(BillingEventsController);
  });

  it('lists billing events through the Nest module graph', async () => {
    await expect(controller.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ eventReference: 'BILL-2026-0001' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates billing events through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        movementServiceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      }),
    ).resolves.toMatchObject({
      eventReference: 'BILL-2026-0002',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        movementServiceId,
      }),
    ).toThrow(BadRequestException);
  });
});
