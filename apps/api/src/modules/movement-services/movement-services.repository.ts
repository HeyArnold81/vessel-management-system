import { Inject, Injectable } from '@nestjs/common';
import type { MovementService, Prisma } from '@prisma/client';

import type {
  CreateMovementServiceInput,
  MovementServiceSortField,
  MovementServiceStatus,
  SortDirection,
  UpdateMovementServiceInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type MovementServicePageResult = {
  readonly movementServices: readonly MovementService[];
  readonly totalItems: number;
};

export type NormalizedMovementServiceListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly status?: MovementServiceStatus;
  readonly movementId?: string;
  readonly serviceId?: string;
  readonly providerOrganizationId?: string;
  readonly serviceReceiverOrganizationId?: string;
  readonly billToOrganizationId?: string;
  readonly payerOrganizationId?: string;
  readonly isBillable?: boolean;
  readonly sortBy: MovementServiceSortField;
  readonly sortDirection: SortDirection;
};

export interface MovementServicesRepository {
  findPage(
    tenantId: string,
    query: NormalizedMovementServiceListQuery,
  ): Promise<MovementServicePageResult>;
  findById(tenantId: string, id: string): Promise<MovementService | null>;
  create(tenantId: string, input: CreateMovementServiceInput): Promise<MovementService>;
  update(tenantId: string, id: string, input: UpdateMovementServiceInput): Promise<MovementService>;
  softDelete(tenantId: string, id: string): Promise<MovementService>;
}

export const MOVEMENT_SERVICES_REPOSITORY = Symbol('MOVEMENT_SERVICES_REPOSITORY');

@Injectable()
export class PrismaMovementServicesRepository implements MovementServicesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedMovementServiceListQuery,
  ): Promise<MovementServicePageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [movementServices, totalItems] = await this.prisma.$transaction([
      this.prisma.movementService.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.movementService.count({ where }),
    ]);

    return { movementServices, totalItems };
  }

  findById(tenantId: string, id: string): Promise<MovementService | null> {
    return this.prisma.movementService.findFirst({
      where: { id, tenantId },
    });
  }

  create(tenantId: string, input: CreateMovementServiceInput): Promise<MovementService> {
    return this.prisma.movementService.create({
      data: {
        tenantId,
        movementId: input.movementId,
        serviceId: input.serviceId,
        providerOrganizationId: input.providerOrganizationId?.trim() || null,
        serviceReceiverOrganizationId: input.serviceReceiverOrganizationId?.trim() || null,
        billToOrganizationId: input.billToOrganizationId?.trim() || null,
        payerOrganizationId: input.payerOrganizationId?.trim() || null,
        status: input.status ?? 'requested',
        quantity: input.quantity,
        unitOfMeasure: input.unitOfMeasure.trim().toLowerCase(),
        requestedAt: this.toDate(input.requestedAt),
        completedAt: this.toDate(input.completedAt),
        isBillable: input.isBillable ?? true,
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    input: UpdateMovementServiceInput,
  ): Promise<MovementService> {
    return this.prisma.movementService.update({
      where: { id, tenantId },
      data: {
        ...(input.movementId !== undefined ? { movementId: input.movementId } : {}),
        ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
        ...(input.providerOrganizationId !== undefined
          ? { providerOrganizationId: input.providerOrganizationId?.trim() || null }
          : {}),
        ...(input.serviceReceiverOrganizationId !== undefined
          ? { serviceReceiverOrganizationId: input.serviceReceiverOrganizationId?.trim() || null }
          : {}),
        ...(input.billToOrganizationId !== undefined
          ? { billToOrganizationId: input.billToOrganizationId?.trim() || null }
          : {}),
        ...(input.payerOrganizationId !== undefined
          ? { payerOrganizationId: input.payerOrganizationId?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
        ...(input.unitOfMeasure !== undefined
          ? { unitOfMeasure: input.unitOfMeasure.trim().toLowerCase() }
          : {}),
        ...(input.requestedAt !== undefined ? { requestedAt: this.toDate(input.requestedAt) } : {}),
        ...(input.completedAt !== undefined ? { completedAt: this.toDate(input.completedAt) } : {}),
        ...(input.isBillable !== undefined ? { isBillable: input.isBillable } : {}),
      },
    });
  }

  softDelete(tenantId: string, id: string): Promise<MovementService> {
    return this.prisma.movementService.update({
      where: { id, tenantId },
      data: { status: 'cancelled' },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedMovementServiceListQuery,
  ): Prisma.MovementServiceWhereInput {
    return {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.movementId ? { movementId: query.movementId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.providerOrganizationId
        ? { providerOrganizationId: query.providerOrganizationId }
        : {}),
      ...(query.serviceReceiverOrganizationId
        ? { serviceReceiverOrganizationId: query.serviceReceiverOrganizationId }
        : {}),
      ...(query.billToOrganizationId ? { billToOrganizationId: query.billToOrganizationId } : {}),
      ...(query.payerOrganizationId ? { payerOrganizationId: query.payerOrganizationId } : {}),
      ...(query.isBillable !== undefined ? { isBillable: query.isBillable } : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedMovementServiceListQuery,
  ): Prisma.MovementServiceOrderByWithRelationInput {
    const sortMap = {
      status: 'status',
      requestedAt: 'requestedAt',
      completedAt: 'completedAt',
      createdAt: 'createdAt',
    } satisfies Record<
      MovementServiceSortField,
      keyof Prisma.MovementServiceOrderByWithRelationInput
    >;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private toDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }
}
