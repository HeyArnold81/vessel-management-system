import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MovementService } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { describe, expect, it, vi } from 'vitest';

import type { MovementServicesRepository } from './movement-services.repository.js';
import { MovementServicesService } from './movement-services.service.js';

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

function buildRepository(
  overrides: Partial<MovementServicesRepository> = {},
): MovementServicesRepository {
  return {
    findPage: vi
      .fn()
      .mockResolvedValue({ movementServices: [buildMovementService()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildMovementService()),
    create: vi.fn().mockResolvedValue(buildMovementService()),
    update: vi.fn().mockResolvedValue(buildMovementService({ status: 'completed' })),
    softDelete: vi.fn().mockResolvedValue(buildMovementService({ status: 'cancelled' })),
    ...overrides,
  };
}

describe('MovementServicesService', () => {
  it('returns a paginated movement service list', async () => {
    const service = new MovementServicesService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ movementId, serviceId, status: 'requested', quantity: '1' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('normalizes string billable filters before querying the repository', async () => {
    const repository = buildRepository();
    const service = new MovementServicesService(repository, { record: vi.fn() });

    await service.list(tenantId, { isBillable: 'true' } as never);

    expect(repository.findPage).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ isBillable: true }),
    );
  });

  it('rejects completed time earlier than requested time', async () => {
    const service = new MovementServicesService(buildRepository(), { record: vi.fn() });

    await expect(
      service.create(tenantId, {
        movementId,
        serviceId,
        quantity: 1,
        unitOfMeasure: 'job',
        requestedAt: '2026-07-01T12:00:00.000Z',
        completedAt: '2026-07-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records an audit event when movement service is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new MovementServicesService(buildRepository(), audit);

    await service.update(tenantId, movementServiceId, { status: 'completed' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'movement_service.update',
        entityId: movementServiceId,
      }),
    );
  });

  it('throws not found when cancelling a missing movement service', async () => {
    const service = new MovementServicesService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, movementServiceId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
