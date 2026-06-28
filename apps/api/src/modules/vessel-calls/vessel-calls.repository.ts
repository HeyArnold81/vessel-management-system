import { Injectable } from '@nestjs/common';
import type { Prisma, VesselCall } from '@prisma/client';

import type {
  CreateVesselCallInput,
  SortDirection,
  UpdateVesselCallInput,
  VesselCallSortField,
  VesselCallStatus,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type VesselCallPageResult = {
  readonly vesselCalls: readonly VesselCall[];
  readonly totalItems: number;
};

export type NormalizedVesselCallListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: VesselCallStatus;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly berthId?: string;
  readonly sortBy: VesselCallSortField;
  readonly sortDirection: SortDirection;
};

export interface VesselCallsRepository {
  findPage(tenantId: string, query: NormalizedVesselCallListQuery): Promise<VesselCallPageResult>;
  findById(tenantId: string, id: string): Promise<VesselCall | null>;
  findByCallReference(tenantId: string, callReference: string): Promise<VesselCall | null>;
  create(tenantId: string, input: CreateVesselCallInput): Promise<VesselCall>;
  update(tenantId: string, id: string, input: UpdateVesselCallInput): Promise<VesselCall>;
  softDelete(tenantId: string, id: string): Promise<VesselCall>;
}

export const VESSEL_CALLS_REPOSITORY = Symbol('VESSEL_CALLS_REPOSITORY');

@Injectable()
export class PrismaVesselCallsRepository implements VesselCallsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedVesselCallListQuery,
  ): Promise<VesselCallPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [vesselCalls, totalItems] = await this.prisma.$transaction([
      this.prisma.vesselCall.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.vesselCall.count({ where }),
    ]);

    return { vesselCalls, totalItems };
  }

  findById(tenantId: string, id: string): Promise<VesselCall | null> {
    return this.prisma.vesselCall.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByCallReference(tenantId: string, callReference: string): Promise<VesselCall | null> {
    return this.prisma.vesselCall.findFirst({
      where: { tenantId, callReference, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateVesselCallInput): Promise<VesselCall> {
    return this.prisma.vesselCall.create({
      data: {
        tenantId,
        callReference: input.callReference.trim().toUpperCase(),
        vesselId: input.vesselId,
        portId: input.portId,
        berthId: input.berthId?.trim() || null,
        agentId: input.agentId?.trim() || null,
        operatorId: input.operatorId?.trim() || null,
        voyageNumber: input.voyageNumber?.trim() || null,
        status: input.status ?? 'planned',
        eta: this.toDate(input.eta),
        etd: this.toDate(input.etd),
        ata: this.toDate(input.ata),
        atd: this.toDate(input.atd),
        remarks: input.remarks?.trim() || null,
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateVesselCallInput): Promise<VesselCall> {
    return this.prisma.vesselCall.update({
      where: { id, tenantId },
      data: {
        ...(input.callReference !== undefined
          ? { callReference: input.callReference.trim().toUpperCase() }
          : {}),
        ...(input.vesselId !== undefined ? { vesselId: input.vesselId } : {}),
        ...(input.portId !== undefined ? { portId: input.portId } : {}),
        ...(input.berthId !== undefined ? { berthId: input.berthId?.trim() || null } : {}),
        ...(input.agentId !== undefined ? { agentId: input.agentId?.trim() || null } : {}),
        ...(input.operatorId !== undefined ? { operatorId: input.operatorId?.trim() || null } : {}),
        ...(input.voyageNumber !== undefined
          ? { voyageNumber: input.voyageNumber?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.eta !== undefined ? { eta: this.toDate(input.eta) } : {}),
        ...(input.etd !== undefined ? { etd: this.toDate(input.etd) } : {}),
        ...(input.ata !== undefined ? { ata: this.toDate(input.ata) } : {}),
        ...(input.atd !== undefined ? { atd: this.toDate(input.atd) } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks?.trim() || null } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<VesselCall> {
    return this.prisma.vesselCall.update({
      where: { id, tenantId },
      data: {
        status: 'cancelled',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedVesselCallListQuery,
  ): Prisma.VesselCallWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.vesselId ? { vesselId: query.vesselId } : {}),
      ...(query.portId ? { portId: query.portId } : {}),
      ...(query.berthId ? { berthId: query.berthId } : {}),
      ...(query.search
        ? {
            OR: [
              { callReference: { contains: query.search, mode: 'insensitive' } },
              { voyageNumber: { contains: query.search, mode: 'insensitive' } },
              { remarks: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedVesselCallListQuery,
  ): Prisma.VesselCallOrderByWithRelationInput {
    const sortMap = {
      callReference: 'callReference',
      eta: 'eta',
      etd: 'etd',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<VesselCallSortField, keyof Prisma.VesselCallOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }
}
