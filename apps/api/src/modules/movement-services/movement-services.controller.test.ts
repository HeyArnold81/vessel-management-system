import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { MovementService } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementServicesController } from './movement-services.controller.js';
import {
  MOVEMENT_SERVICES_REPOSITORY,
  type MovementServicesRepository,
} from './movement-services.repository.js';
import {
  MOVEMENT_SERVICE_AUDIT_RECORDER,
  MovementServicesService,
} from './movement-services.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const movementServiceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const movementId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const serviceId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function buildMovementService(overrides: Partial<MovementService> = {}): MovementService {
  return {
    id: movementServiceId,
    tenantId,
    movementId,
    serviceId,
    providerOrganizationId: null,
    serviceReceiverOrganizationId: null,
    billToOrganizationId: null,
    payerOrganizationId: null,
    status: 'requested',
    quantity: new Decimal(1),
    unitOfMeasure: 'job',
    requestedAt: new Date('2026-07-01T10:00:00.000Z'),
    completedAt: null,
    isBillable: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

class InMemoryMovementServicesRepository implements MovementServicesRepository {
  private movementServices = [buildMovementService()];

  async findPage(): Promise<{ movementServices: readonly MovementService[]; totalItems: number }> {
    return { movementServices: this.movementServices, totalItems: this.movementServices.length };
  }

  async findById(_tenantId: string, id: string): Promise<MovementService | null> {
    return this.movementServices.find((service) => service.id === id) ?? null;
  }

  async create(
    tenant: string,
    input: { movementId: string; serviceId: string; quantity: number; unitOfMeasure: string },
  ): Promise<MovementService> {
    const service = buildMovementService({
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      tenantId: tenant,
      movementId: input.movementId,
      serviceId: input.serviceId,
      quantity: new Decimal(input.quantity),
      unitOfMeasure: input.unitOfMeasure,
    });
    this.movementServices.push(service);
    return service;
  }

  async update(): Promise<MovementService> {
    return buildMovementService({ status: 'completed' });
  }

  async softDelete(): Promise<MovementService> {
    return buildMovementService({ status: 'cancelled' });
  }
}

describe('MovementServicesController integration', () => {
  let controller: MovementServicesController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MovementServicesController],
      providers: [
        MovementServicesService,
        { provide: MOVEMENT_SERVICES_REPOSITORY, useClass: InMemoryMovementServicesRepository },
        { provide: MOVEMENT_SERVICE_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(MovementServicesController);
  });

  it('lists movement services through the Nest module graph', async () => {
    await expect(controller.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ movementId, serviceId }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a movement service through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        movementId,
        serviceId,
        quantity: 2,
        unitOfMeasure: 'job',
      }),
    ).resolves.toMatchObject({
      movementId,
      serviceId,
      quantity: '2',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        movementId,
        serviceId,
        quantity: 2,
        unitOfMeasure: 'job',
      }),
    ).toThrow(BadRequestException);
  });
});
