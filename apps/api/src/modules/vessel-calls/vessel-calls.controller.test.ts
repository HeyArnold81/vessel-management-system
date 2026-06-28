import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { VesselCall } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { VesselCallsController } from './vessel-calls.controller.js';
import { VESSEL_CALLS_REPOSITORY, type VesselCallsRepository } from './vessel-calls.repository.js';
import { VESSEL_CALL_AUDIT_RECORDER, VesselCallsService } from './vessel-calls.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const vesselCallId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const vesselId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const portId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function buildVesselCall(overrides: Partial<VesselCall> = {}): VesselCall {
  return {
    id: vesselCallId,
    tenantId,
    callReference: 'CALL-2026-0001',
    vesselId,
    portId,
    berthId: null,
    agentId: null,
    operatorId: null,
    voyageNumber: 'VOY-7781',
    status: 'expected',
    eta: new Date('2026-07-01T10:00:00.000Z'),
    etd: new Date('2026-07-02T18:00:00.000Z'),
    ata: null,
    atd: null,
    remarks: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

class InMemoryVesselCallsRepository implements VesselCallsRepository {
  private vesselCalls = [buildVesselCall()];

  async findPage(): Promise<{ vesselCalls: readonly VesselCall[]; totalItems: number }> {
    return { vesselCalls: this.vesselCalls, totalItems: this.vesselCalls.length };
  }

  async findById(_tenantId: string, id: string): Promise<VesselCall | null> {
    return (
      this.vesselCalls.find(
        (vesselCall) => vesselCall.id === id && vesselCall.deletedAt === null,
      ) ?? null
    );
  }

  async findByCallReference(_tenantId: string, callReference: string): Promise<VesselCall | null> {
    return (
      this.vesselCalls.find(
        (vesselCall) => vesselCall.callReference === callReference && vesselCall.deletedAt === null,
      ) ?? null
    );
  }

  async create(
    tenant: string,
    input: { callReference: string; vesselId: string; portId: string },
  ): Promise<VesselCall> {
    const vesselCall = buildVesselCall({
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      tenantId: tenant,
      callReference: input.callReference,
      vesselId: input.vesselId,
      portId: input.portId,
      status: 'planned',
    });
    this.vesselCalls.push(vesselCall);
    return vesselCall;
  }

  async update(): Promise<VesselCall> {
    return buildVesselCall({ status: 'alongside' });
  }

  async softDelete(): Promise<VesselCall> {
    return buildVesselCall({
      status: 'cancelled',
      deletedAt: new Date('2026-01-03T00:00:00.000Z'),
    });
  }
}

describe('VesselCallsController integration', () => {
  let controller: VesselCallsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VesselCallsController],
      providers: [
        VesselCallsService,
        { provide: VESSEL_CALLS_REPOSITORY, useClass: InMemoryVesselCallsRepository },
        { provide: VESSEL_CALL_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(VesselCallsController);
  });

  it('lists vessel calls through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'CALL-2026' }),
    ).resolves.toMatchObject({
      data: [{ callReference: 'CALL-2026-0001' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a vessel call through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        callReference: 'CALL-2026-0002',
        vesselId,
        portId,
      }),
    ).resolves.toMatchObject({
      callReference: 'CALL-2026-0002',
      vesselId,
      portId,
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        callReference: 'CALL-2026-0002',
        vesselId,
        portId,
      }),
    ).toThrow(BadRequestException);
  });
});
