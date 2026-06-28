import { Injectable } from '@nestjs/common';
import type { Prisma, Vessel } from '@prisma/client';

import type {
  CreateVesselInput,
  SortDirection,
  UpdateVesselInput,
  VesselSortField,
  VesselStatus,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type VesselPageResult = {
  readonly vessels: readonly Vessel[];
  readonly totalItems: number;
};

export type NormalizedVesselListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: VesselStatus;
  readonly vesselType: string;
  readonly sortBy: VesselSortField;
  readonly sortDirection: SortDirection;
};

export interface VesselsRepository {
  findPage(tenantId: string, query: NormalizedVesselListQuery): Promise<VesselPageResult>;
  findById(tenantId: string, id: string): Promise<Vessel | null>;
  findByImoNumber(tenantId: string, imoNumber: string): Promise<Vessel | null>;
  create(tenantId: string, input: CreateVesselInput): Promise<Vessel>;
  update(tenantId: string, id: string, input: UpdateVesselInput): Promise<Vessel>;
  softDelete(tenantId: string, id: string): Promise<Vessel>;
}

export const VESSELS_REPOSITORY = Symbol('VESSELS_REPOSITORY');

@Injectable()
export class PrismaVesselsRepository implements VesselsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(tenantId: string, query: NormalizedVesselListQuery): Promise<VesselPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [vessels, totalItems] = await this.prisma.$transaction([
      this.prisma.vessel.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.vessel.count({ where }),
    ]);

    return { vessels, totalItems };
  }

  findById(tenantId: string, id: string): Promise<Vessel | null> {
    return this.prisma.vessel.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByImoNumber(tenantId: string, imoNumber: string): Promise<Vessel | null> {
    return this.prisma.vessel.findFirst({
      where: { tenantId, imoNumber, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateVesselInput): Promise<Vessel> {
    return this.prisma.vessel.create({
      data: {
        tenantId,
        name: input.name.trim(),
        imoNumber: input.imoNumber.trim(),
        mmsi: input.mmsi?.trim() || null,
        callSign: input.callSign?.trim() || null,
        vesselType: input.vesselType,
        grossTonnage: input.grossTonnage ?? null,
        lengthOverallM: input.lengthOverallM ?? null,
        maxDraftM: input.maxDraftM ?? null,
        status: input.status ?? 'active',
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateVesselInput): Promise<Vessel> {
    return this.prisma.vessel.update({
      where: { id, tenantId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.imoNumber !== undefined ? { imoNumber: input.imoNumber.trim() } : {}),
        ...(input.mmsi !== undefined ? { mmsi: input.mmsi?.trim() || null } : {}),
        ...(input.callSign !== undefined ? { callSign: input.callSign?.trim() || null } : {}),
        ...(input.vesselType !== undefined ? { vesselType: input.vesselType } : {}),
        ...(input.grossTonnage !== undefined ? { grossTonnage: input.grossTonnage } : {}),
        ...(input.lengthOverallM !== undefined ? { lengthOverallM: input.lengthOverallM } : {}),
        ...(input.maxDraftM !== undefined ? { maxDraftM: input.maxDraftM } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<Vessel> {
    return this.prisma.vessel.update({
      where: { id, tenantId },
      data: {
        status: 'inactive',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(tenantId: string, query: NormalizedVesselListQuery): Prisma.VesselWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.vesselType ? { vesselType: query.vesselType } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { imoNumber: { contains: query.search, mode: 'insensitive' } },
              { callSign: { contains: query.search, mode: 'insensitive' } },
              { mmsi: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(query: NormalizedVesselListQuery): Prisma.VesselOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      imoNumber: 'imoNumber',
      vesselType: 'vesselType',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<VesselSortField, keyof Prisma.VesselOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
