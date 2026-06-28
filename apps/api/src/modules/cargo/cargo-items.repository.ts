import { Injectable } from '@nestjs/common';
import type { CargoItem, Prisma } from '@prisma/client';

import type {
  CargoCategory,
  CargoItemSortField,
  CargoItemStatus,
  CreateCargoItemInput,
  SortDirection,
  UpdateCargoItemInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type CargoItemPageResult = {
  readonly cargoItems: readonly CargoItem[];
  readonly totalItems: number;
};

export type NormalizedCargoItemListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: CargoItemStatus;
  readonly cargoCategory?: CargoCategory;
  readonly isHazardous?: boolean;
  readonly sortBy: CargoItemSortField;
  readonly sortDirection: SortDirection;
};

export interface CargoItemsRepository {
  findPage(tenantId: string, query: NormalizedCargoItemListQuery): Promise<CargoItemPageResult>;
  findById(tenantId: string, id: string): Promise<CargoItem | null>;
  findByCargoCode(tenantId: string, cargoCode: string): Promise<CargoItem | null>;
  create(tenantId: string, input: CreateCargoItemInput): Promise<CargoItem>;
  update(tenantId: string, id: string, input: UpdateCargoItemInput): Promise<CargoItem>;
  softDelete(tenantId: string, id: string): Promise<CargoItem>;
}

export const CARGO_ITEMS_REPOSITORY = Symbol('CARGO_ITEMS_REPOSITORY');

@Injectable()
export class PrismaCargoItemsRepository implements CargoItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedCargoItemListQuery,
  ): Promise<CargoItemPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [cargoItems, totalItems] = await this.prisma.$transaction([
      this.prisma.cargoItem.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.cargoItem.count({ where }),
    ]);

    return { cargoItems, totalItems };
  }

  findById(tenantId: string, id: string): Promise<CargoItem | null> {
    return this.prisma.cargoItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByCargoCode(tenantId: string, cargoCode: string): Promise<CargoItem | null> {
    return this.prisma.cargoItem.findFirst({
      where: { tenantId, cargoCode, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateCargoItemInput): Promise<CargoItem> {
    return this.prisma.cargoItem.create({
      data: {
        tenantId,
        cargoCode: input.cargoCode.trim().toUpperCase(),
        name: input.name.trim(),
        cargoCategory: input.cargoCategory,
        unNumber: input.unNumber?.trim() || null,
        isHazardous: input.isHazardous ?? false,
        status: input.status ?? 'active',
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateCargoItemInput): Promise<CargoItem> {
    return this.prisma.cargoItem.update({
      where: { id, tenantId },
      data: {
        ...(input.cargoCode !== undefined
          ? { cargoCode: input.cargoCode.trim().toUpperCase() }
          : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.cargoCategory !== undefined ? { cargoCategory: input.cargoCategory } : {}),
        ...(input.unNumber !== undefined ? { unNumber: input.unNumber?.trim() || null } : {}),
        ...(input.isHazardous !== undefined ? { isHazardous: input.isHazardous } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<CargoItem> {
    return this.prisma.cargoItem.update({
      where: { id, tenantId },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedCargoItemListQuery,
  ): Prisma.CargoItemWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.cargoCategory ? { cargoCategory: query.cargoCategory } : {}),
      ...(query.isHazardous !== undefined ? { isHazardous: query.isHazardous } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { cargoCode: { contains: query.search, mode: 'insensitive' } },
              { unNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedCargoItemListQuery,
  ): Prisma.CargoItemOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      cargoCode: 'cargoCode',
      cargoCategory: 'cargoCategory',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<CargoItemSortField, keyof Prisma.CargoItemOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
