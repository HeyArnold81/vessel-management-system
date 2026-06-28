import { Injectable } from '@nestjs/common';
import type { Berth, Prisma } from '@prisma/client';

import type {
  BerthSortField,
  BerthStatus,
  CreateBerthInput,
  SortDirection,
  UpdateBerthInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type BerthPageResult = {
  readonly berths: readonly Berth[];
  readonly totalItems: number;
};

export type NormalizedBerthListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: BerthStatus;
  readonly terminalId: string;
  readonly sortBy: BerthSortField;
  readonly sortDirection: SortDirection;
};

export interface BerthsRepository {
  findPage(tenantId: string, query: NormalizedBerthListQuery): Promise<BerthPageResult>;
  findById(tenantId: string, id: string): Promise<Berth | null>;
  findByTerminalAndCode(tenantId: string, terminalId: string, code: string): Promise<Berth | null>;
  create(tenantId: string, input: CreateBerthInput): Promise<Berth>;
  update(tenantId: string, id: string, input: UpdateBerthInput): Promise<Berth>;
  softDelete(tenantId: string, id: string): Promise<Berth>;
}

export const BERTHS_REPOSITORY = Symbol('BERTHS_REPOSITORY');

@Injectable()
export class PrismaBerthsRepository implements BerthsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(tenantId: string, query: NormalizedBerthListQuery): Promise<BerthPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [berths, totalItems] = await this.prisma.$transaction([
      this.prisma.berth.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.berth.count({ where }),
    ]);

    return { berths, totalItems };
  }

  findById(tenantId: string, id: string): Promise<Berth | null> {
    return this.prisma.berth.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByTerminalAndCode(tenantId: string, terminalId: string, code: string): Promise<Berth | null> {
    return this.prisma.berth.findFirst({
      where: { tenantId, terminalId, code, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateBerthInput): Promise<Berth> {
    return this.prisma.berth.create({
      data: {
        tenantId,
        terminalId: input.terminalId,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        maxLengthM: input.maxLengthM ?? null,
        maxDraftM: input.maxDraftM ?? null,
        status: input.status ?? 'active',
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateBerthInput): Promise<Berth> {
    return this.prisma.berth.update({
      where: { id, tenantId },
      data: {
        ...(input.terminalId !== undefined ? { terminalId: input.terminalId } : {}),
        ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.maxLengthM !== undefined ? { maxLengthM: input.maxLengthM } : {}),
        ...(input.maxDraftM !== undefined ? { maxDraftM: input.maxDraftM } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<Berth> {
    return this.prisma.berth.update({
      where: { id, tenantId },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(tenantId: string, query: NormalizedBerthListQuery): Prisma.BerthWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.terminalId ? { terminalId: query.terminalId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(query: NormalizedBerthListQuery): Prisma.BerthOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      code: 'code',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<BerthSortField, keyof Prisma.BerthOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
