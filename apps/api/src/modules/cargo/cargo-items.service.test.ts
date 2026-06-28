import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CargoItem } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { CargoItemsService } from './cargo-items.service.js';
import type { CargoItemsRepository } from './cargo-items.repository.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const cargoItemId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function buildCargoItem(overrides: Partial<CargoItem> = {}): CargoItem {
  return {
    id: cargoItemId,
    tenantId,
    cargoCode: 'IRON-ORE',
    name: 'Iron Ore Fines',
    cargoCategory: 'bulk',
    unNumber: null,
    isHazardous: false,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function buildRepository(overrides: Partial<CargoItemsRepository> = {}): CargoItemsRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ cargoItems: [buildCargoItem()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildCargoItem()),
    findByCargoCode: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(buildCargoItem()),
    update: vi.fn().mockResolvedValue(buildCargoItem({ name: 'Iron Ore Pellets' })),
    softDelete: vi
      .fn()
      .mockResolvedValue(buildCargoItem({ status: 'inactive', deletedAt: new Date() })),
    ...overrides,
  };
}

describe('CargoItemsService', () => {
  it('returns a paginated cargo catalog list', async () => {
    const service = new CargoItemsService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ name: 'Iron Ore Fines', cargoCode: 'IRON-ORE' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate cargo codes on create', async () => {
    const service = new CargoItemsService(
      buildRepository({ findByCargoCode: vi.fn().mockResolvedValue(buildCargoItem()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        cargoCode: 'IRON-ORE',
        name: 'Duplicate Cargo',
        cargoCategory: 'bulk',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records an audit event when cargo is updated', async () => {
    const audit = { record: vi.fn() };
    const service = new CargoItemsService(buildRepository(), audit);

    await service.update(tenantId, cargoItemId, { name: 'Iron Ore Pellets' });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'cargo_item.update',
        entityId: cargoItemId,
      }),
    );
  });

  it('throws not found when deleting missing cargo', async () => {
    const service = new CargoItemsService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.remove(tenantId, cargoItemId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
