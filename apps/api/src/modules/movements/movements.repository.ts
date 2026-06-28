import { Injectable } from '@nestjs/common';
import type { Prisma, VesselMovement } from '@prisma/client';

import type {
  CreateMovementInput,
  MovementSortField,
  MovementStatus,
  MovementType,
  SortDirection,
  UpdateMovementInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type MovementPageResult = {
  readonly movements: readonly VesselMovement[];
  readonly totalItems: number;
};

export type NormalizedMovementListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: MovementStatus;
  readonly movementType?: MovementType;
  readonly vesselCallId?: string;
  readonly vesselId?: string;
  readonly portId?: string;
  readonly sortBy: MovementSortField;
  readonly sortDirection: SortDirection;
};

export interface MovementsRepository {
  findPage(tenantId: string, query: NormalizedMovementListQuery): Promise<MovementPageResult>;
  findById(tenantId: string, id: string): Promise<VesselMovement | null>;
  findByMovementReference(
    tenantId: string,
    movementReference: string,
  ): Promise<VesselMovement | null>;
  create(tenantId: string, input: CreateMovementInput): Promise<VesselMovement>;
  update(tenantId: string, id: string, input: UpdateMovementInput): Promise<VesselMovement>;
  softDelete(tenantId: string, id: string): Promise<VesselMovement>;
}

export const MOVEMENTS_REPOSITORY = Symbol('MOVEMENTS_REPOSITORY');

@Injectable()
export class PrismaMovementsRepository implements MovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedMovementListQuery,
  ): Promise<MovementPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [movements, totalItems] = await this.prisma.$transaction([
      this.prisma.vesselMovement.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.vesselMovement.count({ where }),
    ]);

    return { movements, totalItems };
  }

  findById(tenantId: string, id: string): Promise<VesselMovement | null> {
    return this.prisma.vesselMovement.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByMovementReference(
    tenantId: string,
    movementReference: string,
  ): Promise<VesselMovement | null> {
    return this.prisma.vesselMovement.findFirst({
      where: { tenantId, movementReference, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateMovementInput): Promise<VesselMovement> {
    const plannedAt = this.toDate(input.plannedAt);
    const actualAt = this.toDate(input.actualAt);

    return this.prisma.vesselMovement.create({
      data: {
        tenantId,
        movementReference: input.movementReference.trim().toUpperCase(),
        vesselCallId: input.vesselCallId,
        vesselId: input.vesselId,
        portId: input.portId,
        fromBerthId: input.fromBerthId?.trim() || null,
        toBerthId: input.toBerthId?.trim() || null,
        movementType: input.movementType,
        status: input.status ?? 'planned',
        plannedAt,
        actualAt,
        eta: plannedAt,
        ata: actualAt,
        remarks: input.remarks?.trim() || null,
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateMovementInput): Promise<VesselMovement> {
    const plannedAt = input.plannedAt === undefined ? undefined : this.toDate(input.plannedAt);
    const actualAt = input.actualAt === undefined ? undefined : this.toDate(input.actualAt);

    return this.prisma.vesselMovement.update({
      where: { id, tenantId },
      data: {
        ...(input.movementReference !== undefined
          ? { movementReference: input.movementReference.trim().toUpperCase() }
          : {}),
        ...(input.vesselCallId !== undefined ? { vesselCallId: input.vesselCallId } : {}),
        ...(input.vesselId !== undefined ? { vesselId: input.vesselId } : {}),
        ...(input.portId !== undefined ? { portId: input.portId } : {}),
        ...(input.fromBerthId !== undefined
          ? { fromBerthId: input.fromBerthId?.trim() || null }
          : {}),
        ...(input.toBerthId !== undefined ? { toBerthId: input.toBerthId?.trim() || null } : {}),
        ...(input.movementType !== undefined ? { movementType: input.movementType } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(plannedAt !== undefined ? { plannedAt, eta: plannedAt } : {}),
        ...(actualAt !== undefined ? { actualAt, ata: actualAt } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks?.trim() || null } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<VesselMovement> {
    return this.prisma.vesselMovement.update({
      where: { id, tenantId },
      data: {
        status: 'cancelled',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedMovementListQuery,
  ): Prisma.VesselMovementWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
      ...(query.vesselId ? { vesselId: query.vesselId } : {}),
      ...(query.portId ? { portId: query.portId } : {}),
      ...(query.search
        ? {
            OR: [
              { movementReference: { contains: query.search, mode: 'insensitive' } },
              { remarks: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedMovementListQuery,
  ): Prisma.VesselMovementOrderByWithRelationInput {
    const sortMap = {
      movementReference: 'movementReference',
      plannedAt: 'plannedAt',
      actualAt: 'actualAt',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<MovementSortField, keyof Prisma.VesselMovementOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }
}
