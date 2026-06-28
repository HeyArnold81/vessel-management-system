import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ServiceCatalog } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { ServiceCatalogController } from './service-catalog.controller.js';
import {
  SERVICE_CATALOG_REPOSITORY,
  type ServiceCatalogRepository,
} from './service-catalog.repository.js';
import {
  SERVICE_CATALOG_AUDIT_RECORDER,
  ServiceCatalogService,
} from './service-catalog.service.js';

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

class InMemoryServiceCatalogRepository implements ServiceCatalogRepository {
  private services = [buildService()];

  async findPage(): Promise<{ services: readonly ServiceCatalog[]; totalItems: number }> {
    return { services: this.services, totalItems: this.services.length };
  }

  async findById(_tenantId: string, id: string): Promise<ServiceCatalog | null> {
    return this.services.find((service) => service.id === id && service.deletedAt === null) ?? null;
  }

  async findByCode(_tenantId: string, code: string): Promise<ServiceCatalog | null> {
    return (
      this.services.find((service) => service.code === code && service.deletedAt === null) ?? null
    );
  }

  async create(
    tenant: string,
    input: { code: string; name: string; category: string; defaultUnit: string },
  ): Promise<ServiceCatalog> {
    const service = buildService({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      tenantId: tenant,
      code: input.code,
      name: input.name,
      category: input.category,
      defaultUnit: input.defaultUnit,
    });
    this.services.push(service);
    return service;
  }

  async update(): Promise<ServiceCatalog> {
    return buildService({ name: 'River Pilotage' });
  }

  async softDelete(): Promise<ServiceCatalog> {
    return buildService({ status: 'inactive', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('ServiceCatalogController integration', () => {
  let controller: ServiceCatalogController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ServiceCatalogController],
      providers: [
        ServiceCatalogService,
        { provide: SERVICE_CATALOG_REPOSITORY, useClass: InMemoryServiceCatalogRepository },
        { provide: SERVICE_CATALOG_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(ServiceCatalogController);
  });

  it('lists services through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'pilot' }),
    ).resolves.toMatchObject({
      data: [{ code: 'PILOTAGE' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates a service through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        code: 'FRESH-WATER',
        name: 'Fresh Water Supply',
        category: 'utilities',
        defaultUnit: 'tonne',
      }),
    ).resolves.toMatchObject({
      code: 'FRESH-WATER',
      name: 'Fresh Water Supply',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        code: 'FRESH-WATER',
        name: 'Fresh Water Supply',
        category: 'utilities',
        defaultUnit: 'tonne',
      }),
    ).toThrow(BadRequestException);
  });
});
