import { Injectable } from '@nestjs/common';
import type { Prisma, ServiceCatalog } from '@prisma/client';

import type {
  CreateServiceCatalogInput,
  ServiceCatalogSortField,
  ServiceCatalogStatus,
  ServiceCategory,
  SortDirection,
  UpdateServiceCatalogInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type ServiceCatalogPageResult = {
  readonly services: readonly ServiceCatalog[];
  readonly totalItems: number;
};

export type NormalizedServiceCatalogListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: ServiceCatalogStatus;
  readonly category?: ServiceCategory;
  readonly isBillable?: boolean;
  readonly sortBy: ServiceCatalogSortField;
  readonly sortDirection: SortDirection;
};

export interface ServiceCatalogRepository {
  findPage(
    tenantId: string,
    query: NormalizedServiceCatalogListQuery,
  ): Promise<ServiceCatalogPageResult>;
  findById(tenantId: string, id: string): Promise<ServiceCatalog | null>;
  findByCode(tenantId: string, code: string): Promise<ServiceCatalog | null>;
  create(tenantId: string, input: CreateServiceCatalogInput): Promise<ServiceCatalog>;
  update(tenantId: string, id: string, input: UpdateServiceCatalogInput): Promise<ServiceCatalog>;
  softDelete(tenantId: string, id: string): Promise<ServiceCatalog>;
}

export const SERVICE_CATALOG_REPOSITORY = Symbol('SERVICE_CATALOG_REPOSITORY');

@Injectable()
export class PrismaServiceCatalogRepository implements ServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedServiceCatalogListQuery,
  ): Promise<ServiceCatalogPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [services, totalItems] = await this.prisma.$transaction([
      this.prisma.serviceCatalog.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.serviceCatalog.count({ where }),
    ]);

    return { services, totalItems };
  }

  findById(tenantId: string, id: string): Promise<ServiceCatalog | null> {
    return this.prisma.serviceCatalog.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByCode(tenantId: string, code: string): Promise<ServiceCatalog | null> {
    return this.prisma.serviceCatalog.findFirst({
      where: { tenantId, code, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateServiceCatalogInput): Promise<ServiceCatalog> {
    return this.prisma.serviceCatalog.create({
      data: {
        tenantId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        category: input.category,
        defaultUnit: input.defaultUnit.trim().toLowerCase(),
        isBillable: input.isBillable ?? true,
        status: input.status ?? 'active',
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateServiceCatalogInput): Promise<ServiceCatalog> {
    return this.prisma.serviceCatalog.update({
      where: { id, tenantId },
      data: {
        ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.defaultUnit !== undefined
          ? { defaultUnit: input.defaultUnit.trim().toLowerCase() }
          : {}),
        ...(input.isBillable !== undefined ? { isBillable: input.isBillable } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<ServiceCatalog> {
    return this.prisma.serviceCatalog.update({
      where: { id, tenantId },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedServiceCatalogListQuery,
  ): Prisma.ServiceCatalogWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.isBillable !== undefined ? { isBillable: query.isBillable } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { defaultUnit: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedServiceCatalogListQuery,
  ): Prisma.ServiceCatalogOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      code: 'code',
      category: 'category',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<
      ServiceCatalogSortField,
      keyof Prisma.ServiceCatalogOrderByWithRelationInput
    >;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
