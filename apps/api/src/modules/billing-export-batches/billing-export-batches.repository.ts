import { Injectable } from '@nestjs/common';
import type { BillingEvent, BillingExportBatch, Prisma } from '@prisma/client';

import type {
  BillingExportBatchSortField,
  BillingExportBatchStatus,
  CreateBillingExportBatchInput,
  SortDirection,
  UpdateBillingExportBatchInput,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type BillingExportBatchPageResult = {
  readonly batches: readonly BillingExportBatch[];
  readonly totalItems: number;
};

export type NormalizedBillingExportBatchListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: BillingExportBatchStatus;
  readonly erpSystem?: string;
  readonly sortBy: BillingExportBatchSortField;
  readonly sortDirection: SortDirection;
};

export interface BillingExportBatchesRepository {
  findPage(
    tenantId: string,
    query: NormalizedBillingExportBatchListQuery,
  ): Promise<BillingExportBatchPageResult>;
  findById(tenantId: string, id: string): Promise<BillingExportBatch | null>;
  findByReference(tenantId: string, batchReference: string): Promise<BillingExportBatch | null>;
  findEligibleBillingEvents(
    tenantId: string,
    billingEventIds: readonly string[],
  ): Promise<readonly BillingEvent[]>;
  create(tenantId: string, input: CreateBillingExportBatchInput): Promise<BillingExportBatch>;
  update(
    tenantId: string,
    id: string,
    input: UpdateBillingExportBatchInput,
  ): Promise<BillingExportBatch>;
  cancel(tenantId: string, id: string): Promise<BillingExportBatch>;
}

export const BILLING_EXPORT_BATCHES_REPOSITORY = Symbol('BILLING_EXPORT_BATCHES_REPOSITORY');

@Injectable()
export class PrismaBillingExportBatchesRepository implements BillingExportBatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedBillingExportBatchListQuery,
  ): Promise<BillingExportBatchPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [batches, totalItems] = await this.prisma.$transaction([
      this.prisma.billingExportBatch.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.billingExportBatch.count({ where }),
    ]);

    return { batches, totalItems };
  }

  findById(tenantId: string, id: string): Promise<BillingExportBatch | null> {
    return this.prisma.billingExportBatch.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByReference(tenantId: string, batchReference: string): Promise<BillingExportBatch | null> {
    return this.prisma.billingExportBatch.findFirst({
      where: { tenantId, batchReference, deletedAt: null },
    });
  }

  findEligibleBillingEvents(
    tenantId: string,
    billingEventIds: readonly string[],
  ): Promise<readonly BillingEvent[]> {
    return this.prisma.billingEvent.findMany({
      where: {
        tenantId,
        id: { in: [...billingEventIds] },
        status: 'ready',
        exportBatchId: null,
        deletedAt: null,
      },
    });
  }

  create(tenantId: string, input: CreateBillingExportBatchInput): Promise<BillingExportBatch> {
    const eventIds = [...new Set(input.billingEventIds)];
    const batchReference =
      input.batchReference?.trim().toUpperCase() ??
      `ERP-EXPORT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${eventIds[0]
        .slice(0, 8)
        .toUpperCase()}`;
    const erpSystem = input.erpSystem.trim().toUpperCase();
    const payload = this.buildPayload(erpSystem, eventIds);

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.billingExportBatch.create({
        data: {
          tenantId,
          batchReference,
          status: 'queued',
          erpSystem,
          eventCount: eventIds.length,
          payload,
        },
      });

      await tx.billingEvent.updateMany({
        where: {
          tenantId,
          id: { in: eventIds },
          status: 'ready',
          exportBatchId: null,
          deletedAt: null,
        },
        data: {
          exportBatchId: batch.id,
          erpSystem,
        },
      });

      return batch;
    });
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateBillingExportBatchInput,
  ): Promise<BillingExportBatch> {
    const statusDates = this.resolveStatusDates(input.status);
    const batch = await this.prisma.billingExportBatch.update({
      where: { id, tenantId },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.externalReference !== undefined
          ? { externalReference: input.externalReference?.trim() || null }
          : {}),
        ...(input.failureReason !== undefined
          ? { failureReason: input.failureReason?.trim() || null }
          : {}),
        ...statusDates,
      },
    });

    await this.applyBatchStatusToEvents(tenantId, id, input.status);

    return batch;
  }

  async cancel(tenantId: string, id: string): Promise<BillingExportBatch> {
    const batch = await this.prisma.billingExportBatch.update({
      where: { id, tenantId },
      data: {
        status: 'cancelled',
        deletedAt: new Date(),
      },
    });

    await this.prisma.billingEvent.updateMany({
      where: {
        tenantId,
        exportBatchId: id,
        status: { in: ['ready', 'failed'] },
        deletedAt: null,
      },
      data: {
        exportBatchId: null,
      },
    });

    return batch;
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedBillingExportBatchListQuery,
  ): Prisma.BillingExportBatchWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.erpSystem ? { erpSystem: query.erpSystem.trim().toUpperCase() } : {}),
      ...(query.search ? { batchReference: { contains: query.search, mode: 'insensitive' } } : {}),
    };
  }

  private buildOrderBy(
    query: NormalizedBillingExportBatchListQuery,
  ): Prisma.BillingExportBatchOrderByWithRelationInput {
    const sortMap = {
      batchReference: 'batchReference',
      status: 'status',
      requestedAt: 'requestedAt',
      completedAt: 'completedAt',
    } satisfies Record<
      BillingExportBatchSortField,
      keyof Prisma.BillingExportBatchOrderByWithRelationInput
    >;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }

  private resolveStatusDates(
    status: BillingExportBatchStatus | undefined,
  ): Prisma.BillingExportBatchUpdateInput {
    if (status === 'exported' || status === 'accepted') {
      return { completedAt: new Date(), failedAt: null };
    }
    if (status === 'failed') {
      return { failedAt: new Date() };
    }
    return {};
  }

  private async applyBatchStatusToEvents(
    tenantId: string,
    batchId: string,
    status: BillingExportBatchStatus | undefined,
  ): Promise<void> {
    if (status === 'exported') {
      await this.prisma.billingEvent.updateMany({
        where: { tenantId, exportBatchId: batchId, deletedAt: null },
        data: { status: 'exported', exportedAt: new Date() },
      });
    }

    if (status === 'accepted') {
      await this.prisma.billingEvent.updateMany({
        where: { tenantId, exportBatchId: batchId, deletedAt: null },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
    }

    if (status === 'failed') {
      await this.prisma.billingEvent.updateMany({
        where: { tenantId, exportBatchId: batchId, deletedAt: null },
        data: { status: 'failed', rejectedAt: new Date() },
      });
    }
  }

  private buildPayload(
    erpSystem: string,
    billingEventIds: readonly string[],
  ): Prisma.InputJsonObject {
    return {
      erpSystem,
      documentType: 'billing_export_batch',
      version: '1.0',
      billingEventIds: [...billingEventIds],
      summary: { eventCount: billingEventIds.length },
    };
  }
}
