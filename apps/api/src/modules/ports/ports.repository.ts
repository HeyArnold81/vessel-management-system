import { Injectable } from '@nestjs/common';
import type { Port, Prisma } from '@prisma/client';

import type {
  CreatePortInput,
  PortSortField,
  PortStatus,
  SortDirection,
  UpdatePortInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type PortPageResult = {
  readonly ports: readonly Port[];
  readonly totalItems: number;
};

export type NormalizedPortListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: PortStatus;
  readonly countryId: string;
  readonly sortBy: PortSortField;
  readonly sortDirection: SortDirection;
};

export interface PortsRepository {
  findPage(tenantId: string, query: NormalizedPortListQuery): Promise<PortPageResult>;
  findById(tenantId: string, id: string): Promise<Port | null>;
  findByUnlocode(tenantId: string, unlocode: string): Promise<Port | null>;
  create(tenantId: string, input: CreatePortInput): Promise<Port>;
  update(tenantId: string, id: string, input: UpdatePortInput): Promise<Port>;
  softDelete(tenantId: string, id: string): Promise<Port>;
}

export const PORTS_REPOSITORY = Symbol('PORTS_REPOSITORY');

@Injectable()
export class PrismaPortsRepository implements PortsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(tenantId: string, query: NormalizedPortListQuery): Promise<PortPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [ports, totalItems] = await this.prisma.$transaction([
      this.prisma.port.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.port.count({ where }),
    ]);

    return { ports, totalItems };
  }

  findById(tenantId: string, id: string): Promise<Port | null> {
    return this.prisma.port.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByUnlocode(tenantId: string, unlocode: string): Promise<Port | null> {
    return this.prisma.port.findFirst({
      where: { tenantId, unlocode, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreatePortInput): Promise<Port> {
    return this.prisma.port.create({
      data: {
        tenantId,
        countryId: input.countryId,
        unlocode: input.unlocode.trim().toUpperCase(),
        name: input.name.trim(),
        timeZone: input.timeZone.trim(),
        status: input.status ?? 'active',
      },
    });
  }

  update(tenantId: string, id: string, input: UpdatePortInput): Promise<Port> {
    return this.prisma.port.update({
      where: { id, tenantId },
      data: {
        ...(input.countryId !== undefined ? { countryId: input.countryId } : {}),
        ...(input.unlocode !== undefined ? { unlocode: input.unlocode.trim().toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.timeZone !== undefined ? { timeZone: input.timeZone.trim() } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<Port> {
    return this.prisma.port.update({
      where: { id, tenantId },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(tenantId: string, query: NormalizedPortListQuery): Prisma.PortWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.countryId ? { countryId: query.countryId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { unlocode: { contains: query.search, mode: 'insensitive' } },
              { timeZone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(query: NormalizedPortListQuery): Prisma.PortOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      unlocode: 'unlocode',
      timeZone: 'timeZone',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<PortSortField, keyof Prisma.PortOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
