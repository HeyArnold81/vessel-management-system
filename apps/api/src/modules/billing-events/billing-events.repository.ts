import { Inject, Injectable } from '@nestjs/common';
import type { BillingEvent, Prisma } from '@prisma/client';

import type {
  BillingEventSortField,
  BillingEventStatus,
  CreateBillingEventInput,
  SortDirection,
  UpdateBillingEventInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type BillingEventPageResult = {
  readonly billingEvents: readonly BillingEvent[];
  readonly totalItems: number;
};

export type NormalizedBillingEventListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: BillingEventStatus;
  readonly movementServiceId?: string;
  readonly erpSystem?: string;
  readonly exportBatchId?: string;
  readonly sortBy: BillingEventSortField;
  readonly sortDirection: SortDirection;
};

export interface BillingEventsRepository {
  findPage(
    tenantId: string,
    query: NormalizedBillingEventListQuery,
  ): Promise<BillingEventPageResult>;
  findById(tenantId: string, id: string): Promise<BillingEvent | null>;
  findByMovementServiceId(
    tenantId: string,
    movementServiceId: string,
  ): Promise<BillingEvent | null>;
  findByEventReference(tenantId: string, eventReference: string): Promise<BillingEvent | null>;
  create(tenantId: string, input: CreateBillingEventInput): Promise<BillingEvent>;
  update(tenantId: string, id: string, input: UpdateBillingEventInput): Promise<BillingEvent>;
  softDelete(tenantId: string, id: string): Promise<BillingEvent>;
}

export const BILLING_EVENTS_REPOSITORY = Symbol('BILLING_EVENTS_REPOSITORY');

@Injectable()
export class PrismaBillingEventsRepository implements BillingEventsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedBillingEventListQuery,
  ): Promise<BillingEventPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [billingEvents, totalItems] = await this.prisma.$transaction([
      this.prisma.billingEvent.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.billingEvent.count({ where }),
    ]);

    return { billingEvents, totalItems };
  }

  findById(tenantId: string, id: string): Promise<BillingEvent | null> {
    return this.prisma.billingEvent.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByMovementServiceId(
    tenantId: string,
    movementServiceId: string,
  ): Promise<BillingEvent | null> {
    return this.prisma.billingEvent.findFirst({
      where: { tenantId, movementServiceId, deletedAt: null },
    });
  }

  findByEventReference(tenantId: string, eventReference: string): Promise<BillingEvent | null> {
    return this.prisma.billingEvent.findFirst({
      where: { tenantId, eventReference, deletedAt: null },
    });
  }

  create(tenantId: string, input: CreateBillingEventInput): Promise<BillingEvent> {
    const eventReference =
      input.eventReference?.trim().toUpperCase() ??
      `BILL-${input.movementServiceId.slice(0, 8).toUpperCase()}`;

    return this.prisma.billingEvent.create({
      data: {
        tenantId,
        eventReference,
        movementServiceId: input.movementServiceId,
        erpSystem: input.erpSystem?.trim().toUpperCase() || null,
        status: 'draft',
        payload: this.toPrismaJson(
          input.payload ?? this.buildDefaultPayload(input.movementServiceId),
        ),
      },
    });
  }

  update(tenantId: string, id: string, input: UpdateBillingEventInput): Promise<BillingEvent> {
    const statusDates = this.resolveStatusDates(input.status);
    const data: Prisma.BillingEventUncheckedUpdateInput = {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.erpSystem !== undefined
        ? { erpSystem: input.erpSystem?.trim().toUpperCase() || null }
        : {}),
      ...(input.exportBatchId !== undefined
        ? { exportBatchId: input.exportBatchId?.trim() || null }
        : {}),
      ...(input.failureReason !== undefined
        ? { failureReason: input.failureReason?.trim() || null }
        : {}),
      ...statusDates,
    };

    return this.prisma.billingEvent.update({
      where: { id, tenantId },
      data,
    });
  }

  softDelete(tenantId: string, id: string): Promise<BillingEvent> {
    return this.prisma.billingEvent.update({
      where: { id, tenantId },
      data: {
        status: 'rejected',
        deletedAt: new Date(),
      },
    });
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedBillingEventListQuery,
  ): Prisma.BillingEventWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.movementServiceId ? { movementServiceId: query.movementServiceId } : {}),
      ...(query.erpSystem ? { erpSystem: query.erpSystem.trim().toUpperCase() } : {}),
      ...(query.exportBatchId ? { exportBatchId: query.exportBatchId } : {}),
      ...(query.search ? { eventReference: { contains: query.search, mode: 'insensitive' } } : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedBillingEventListQuery,
  ): Prisma.BillingEventOrderByWithRelationInput {
    const sortMap = {
      eventReference: 'eventReference',
      status: 'status',
      createdAt: 'createdAt',
      exportedAt: 'exportedAt',
    } satisfies Record<BillingEventSortField, keyof Prisma.BillingEventOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private resolveStatusDates(
    status: BillingEventStatus | undefined,
  ): Prisma.BillingEventUpdateInput {
    if (status === 'exported') {
      return { exportedAt: new Date() };
    }
    if (status === 'accepted') {
      return { acceptedAt: new Date() };
    }
    if (status === 'rejected' || status === 'failed') {
      return { rejectedAt: new Date() };
    }
    return {};
  }

  private buildDefaultPayload(movementServiceId: string): Prisma.InputJsonObject {
    return {
      source: { movementServiceId },
      service: {},
      erp: { documentType: 'billing_request', version: '1.0' },
      snapshot: { generatedFrom: 'movement_service', movementServiceId },
    };
  }

  private toPrismaJson(payload: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
  }
}
