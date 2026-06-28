import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { VesselMovement } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementsController } from './movements.controller.js';
import { MOVEMENTS_REPOSITORY, type MovementsRepository } from './movements.repository.js';
import { MOVEMENT_AUDIT_RECORDER, MovementsService } from './movements.service.js';

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

class InMemoryMovementsRepository implements MovementsRepository {
  private movements = [buildMovement()];

  async findPage(): Promise<{ movements: readonly VesselMovement[]; totalItems: number }> {
    return { movements: this.movements, totalItems: this.movements.length };
  }

  async findById(_tenantId: string, id: string): Promise<VesselMovement | null> {
    return (
      this.movements.find((movement) => movement.id === id && movement.deletedAt === null) ?? null
    );
  }

  async findByMovementReference(
    _tenantId: string,
    movementReference: string,
  ): Promise<VesselMovement | null> {
    return (
      this.movements.find(
        (movement) =>
          movement.movementReference === movementReference && movement.deletedAt === null,
      ) ?? null
    );
  }

  async create(
    tenant: string,
    input: { movementReference: string; vesselCallId: string; vesselId: string; portId: string },
  ): Promise<VesselMovement> {
    const movement = buildMovement({
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      tenantId: tenant,
      movementReference: input.movementReference,
      vesselCallId: input.vesselCallId,
      vesselId: input.vesselId,
      portId: input.portId,
    });
    this.movements.push(movement);
    return movement;
  }

  async update(): Promise<VesselMovement> {
    return buildMovement({ status: 'completed' });
  }

  async softDelete(): Promise<VesselMovement> {
    return buildMovement({ status: 'cancelled', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('MovementsController integration', () => {
  let controller: MovementsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MovementsController],
      providers: [
        MovementsService,
        { provide: MOVEMENTS_REPOSITORY, useClass: InMemoryMovementsRepository },
        { provide: MOVEMENT_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(MovementsController);
  });

  it('lists movements through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'MOVE-2026' }),
    ).resolves.toMatchObject({
      data: [{ movementReference: 'MOVE-2026-0001' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a movement through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        movementReference: 'MOVE-2026-0002',
        vesselCallId,
        vesselId,
        portId,
        movementType: 'arrival',
      }),
    ).resolves.toMatchObject({
      movementReference: 'MOVE-2026-0002',
      vesselCallId,
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        movementReference: 'MOVE-2026-0002',
        vesselCallId,
        vesselId,
        portId,
        movementType: 'arrival',
      }),
    ).toThrow(BadRequestException);
  });
});
