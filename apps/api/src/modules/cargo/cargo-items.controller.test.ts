import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CargoItem } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';

import { CargoItemsController } from './cargo-items.controller.js';
import { CARGO_ITEMS_REPOSITORY, type CargoItemsRepository } from './cargo-items.repository.js';
import { CARGO_ITEM_AUDIT_RECORDER, CargoItemsService } from './cargo-items.service.js';

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

class InMemoryCargoItemsRepository implements CargoItemsRepository {
  private cargoItems = [buildCargoItem()];

  async findPage(): Promise<{ cargoItems: readonly CargoItem[]; totalItems: number }> {
    return { cargoItems: this.cargoItems, totalItems: this.cargoItems.length };
  }

  async findById(_tenantId: string, id: string): Promise<CargoItem | null> {
    return (
      this.cargoItems.find((cargoItem) => cargoItem.id === id && cargoItem.deletedAt === null) ??
      null
    );
  }

  async findByCargoCode(_tenantId: string, cargoCode: string): Promise<CargoItem | null> {
    return (
      this.cargoItems.find(
        (cargoItem) => cargoItem.cargoCode === cargoCode && cargoItem.deletedAt === null,
      ) ?? null
    );
  }

  async create(
    tenant: string,
    input: { cargoCode: string; name: string; cargoCategory: string },
  ): Promise<CargoItem> {
    const cargoItem = buildCargoItem({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      tenantId: tenant,
      cargoCode: input.cargoCode,
      name: input.name,
      cargoCategory: input.cargoCategory,
    });
    this.cargoItems.push(cargoItem);
    return cargoItem;
  }

  async update(): Promise<CargoItem> {
    return buildCargoItem();
  }

  async softDelete(): Promise<CargoItem> {
    return buildCargoItem({ status: 'inactive', deletedAt: new Date('2026-01-03T00:00:00.000Z') });
  }
}

describe('CargoItemsController integration', () => {
  let controller: CargoItemsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CargoItemsController],
      providers: [
        CargoItemsService,
        { provide: CARGO_ITEMS_REPOSITORY, useClass: InMemoryCargoItemsRepository },
        { provide: CARGO_ITEM_AUDIT_RECORDER, useValue: { record: async () => undefined } },
      ],
    }).compile();

    controller = moduleRef.get(CargoItemsController);
  });

  it('lists cargo through the Nest module graph', async () => {
    await expect(
      controller.list(tenantId, { page: 1, pageSize: 10, search: 'iron' }),
    ).resolves.toMatchObject({
      data: [{ cargoCode: 'IRON-ORE' }],
      meta: { totalItems: 1 },
    });
  });

  it('creates cargo through the Nest module graph', async () => {
    await expect(
      controller.create(tenantId, {
        cargoCode: 'WHEAT',
        name: 'Wheat',
        cargoCategory: 'bulk',
      }),
    ).resolves.toMatchObject({
      name: 'Wheat',
      cargoCode: 'WHEAT',
    });
  });

  it('rejects missing tenant context', async () => {
    expect(() =>
      controller.create(undefined, {
        cargoCode: 'WHEAT',
        name: 'Wheat',
        cargoCategory: 'bulk',
      }),
    ).toThrow(BadRequestException);
  });
});
