import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { VesselMovement } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { MovementsService } from './movements.service.js';
import type { MovementsRepository } from './movements.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const movementId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const vesselCallId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const vesselId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const portId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function buildMovement(overrides: Partial<VesselMovement> = {}): VesselMovement {
  return {
    id: movementId,
    tenantId,
    movementReference: 'MOVE-2026-0001',
    vesselCallId,
    vesselId,
    portId,
    fromBerthId: null,
    toBerthId: null,
    movementType: 'arrival',
    status: 'planned',
    plannedAt: new Date('2026-07-01T10:00:00.000Z'),
    actualAt: null,
    eta: new Date('2026-07-01T10:00:00.000Z'),
    etd: null,
    ata: null,
    atd: null,
    remarks: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(overrides: Partial<MovementsRepository> = {}): MovementsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ movements: [buildMovement()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildMovement()),
    findByMovementReference: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildMovement()),
    update: vi.fn().mockResolvedValue(buildMovement({ status: 'completed' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildMovement({ status: 'cancelled', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('MovementsService', () => {
  it('returns a paginated movement list', async () => {
    const service = new MovementsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ movementReference: 'MOVE-2026-0001', movementType: 'arrival' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate movement references on create', async () => {
    const service = new MovementsService(
      buildRepository({ findByMovementReference: vi.fn().mockResolvedValue(buildMovement()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        movementReference: 'MOVE-2026-0001',
        vesselCallId,
        vesselId,
        portId,
        movementType: 'arrival',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects actual time earlier than planned time', async () => {
    const service = new MovementsService(buildRepository(), { record: vi.fn() });

    await expect(
      service.create(tenantId, {
        movementReference: 'MOVE-2026-0002',
        vesselCallId,
        vesselId,
        portId,
        movementType: 'arrival',
        plannedAt: '2026-07-01T10:00:00.000Z',
        actualAt: '2026-07-01T09:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records an audit event when movement is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new MovementsService(buildRepository(), audit);

    await service.update(tenantId, movementId, { status: 'completed' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'movement.update',
        entityId: movementId,
      }),
    );
  });

  it('throws not found when deleting a missing movement', async () => {
    const service = new MovementsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, movementId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
