import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ServiceCatalog } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { ServiceCatalogRepository } from './service-catalog.repository.js';
import { ServiceCatalogService } from './service-catalog.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const serviceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function buildService(overrides: Partial<ServiceCatalog> = {}): ServiceCatalog {
  return {
    id: serviceId,
    tenantId,
    code: 'PILOTAGE',
    name: 'Harbour Pilotage',
    category: 'pilotage',
    defaultUnit: 'job',
    isBillable: true,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(
  overrides: Partial<ServiceCatalogRepository> = {},
): ServiceCatalogRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ services: [buildService()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildService()),
    findByCode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildService()),
    update: vi.fn().mockResolvedValue(buildService({ name: 'River Pilotage' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildService({ status: 'inactive', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('ServiceCatalogService', () => {
  it('returns a paginated service catalog list', async () => {
    const service = new ServiceCatalogService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ code: 'PILOTAGE', name: 'Harbour Pilotage' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate service codes on create', async () => {
    const service = new ServiceCatalogService(
      buildRepository({ findByCode: vi.fn().mockResolvedValue(buildService()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        code: 'PILOTAGE',
        name: 'Duplicate Pilotage',
        category: 'pilotage',
        defaultUnit: 'job',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when service is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new ServiceCatalogService(buildRepository(), audit);

    await service.update(tenantId, serviceId, { name: 'River Pilotage' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'service_catalog.update',
        entityId: serviceId,
      }),
    );
  });

  it('throws not found when deleting a missing service', async () => {
    const service = new ServiceCatalogService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, serviceId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
