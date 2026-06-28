import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { VesselCall } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { VesselCallsService } from './vessel-calls.service.js';
import type { VesselCallsRepository } from './vessel-calls.repository.js';

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

function buildRepository(overrides: Partial<VesselCallsRepository> = {}): VesselCallsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ vesselCalls: [buildVesselCall()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildVesselCall()),
    findByCallReference: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildVesselCall()),
    update: vi.fn().mockResolvedValue(buildVesselCall({ status: 'alongside' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildVesselCall({ status: 'cancelled', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('VesselCallsService', () => {
  it('returns a paginated vessel call list', async () => {
    const service = new VesselCallsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ callReference: 'CALL-2026-0001', status: 'expected' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate call references on create', async () => {
    const service = new VesselCallsService(
      buildRepository({ findByCallReference: vi.fn().mockResolvedValue(buildVesselCall()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        callReference: 'CALL-2026-0001',
        vesselId,
        portId,
        status: 'expected',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects planned departure before planned arrival', async () => {
    const service = new VesselCallsService(buildRepository(), { record: vi.fn() });

    await expect(
      service.create(tenantId, {
        callReference: 'CALL-2026-0002',
        vesselId,
        portId,
        eta: '2026-07-02T18:00:00.000Z',
        etd: '2026-07-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records an audit event when a vessel call is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new VesselCallsService(buildRepository(), audit);

    await service.update(tenantId, vesselCallId, { status: 'alongside' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'vessel_call.update',
        entityId: vesselCallId,
      }),
    );
  });

  it('throws not found when deleting a missing vessel call', async () => {
    const service = new VesselCallsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, vesselCallId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
