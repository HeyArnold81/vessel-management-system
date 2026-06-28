import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service.js';

export type NormalizedReportQuery = {
  readonly from?: Date;
  readonly to?: Date;
  readonly portId?: string;
};

export type GroupCount = {
  readonly key: string;
  readonly count: number;
};

export type ReportActivityRow = {
  readonly id: string;
  readonly reference: string;
  readonly status: string;
  readonly occurredAt: Date | null;
  readonly portId?: string | null;
  readonly berthId?: string | null;
};

export type ReportsData = {
  readonly vesselCallCount: number;
  readonly movementCount: number;
  readonly movementServiceCount: number;
  readonly billingEventCount: number;
  readonly failedBillingEventCount: number;
  readonly readyBillingEventCount: number;
  readonly exportBatchCount: number;
  readonly vesselCallsByStatus: readonly GroupCount[];
  readonly movementsByStatus: readonly GroupCount[];
  readonly movementsByType: readonly GroupCount[];
  readonly berthActivity: readonly GroupCount[];
  readonly billingEventsByStatus: readonly GroupCount[];
  readonly billableServicesByStatus: readonly GroupCount[];
  readonly exportBatchesByStatus: readonly GroupCount[];
  readonly upcomingArrivals: readonly ReportActivityRow[];
  readonly upcomingDepartures: readonly ReportActivityRow[];
  readonly pendingBillingEvents: readonly ReportActivityRow[];
  readonly failedBillingEvents: readonly ReportActivityRow[];
};

export interface ReportsRepository {
  getOverviewData(tenantId: string, query: NormalizedReportQuery): Promise<ReportsData>;
}

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

@Injectable()
export class PrismaReportsRepository implements ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewData(tenantId: string, query: NormalizedReportQuery): Promise<ReportsData> {
    const vesselCallWhere = this.buildVesselCallWhere(tenantId, query);
    const movementWhere = this.buildMovementWhere(tenantId, query);
    const movementServiceWhere = this.buildMovementServiceWhere(tenantId, query);
    const billingEventWhere = this.buildBillingEventWhere(tenantId, query);
    const exportBatchWhere = this.buildExportBatchWhere(tenantId, query);

    const [
      vesselCallCount,
      movementCount,
      movementServiceCount,
      billingEventCount,
      failedBillingEventCount,
      readyBillingEventCount,
      exportBatchCount,
      vesselCallsByStatus,
      movementsByStatus,
      movementsByType,
      berthActivity,
      billingEventsByStatus,
      billableServicesByStatus,
      exportBatchesByStatus,
      upcomingArrivals,
      upcomingDepartures,
      pendingBillingEvents,
      failedBillingEvents,
    ] = await this.prisma.$transaction([
      this.prisma.vesselCall.count({ where: vesselCallWhere }),
      this.prisma.vesselMovement.count({ where: movementWhere }),
      this.prisma.movementService.count({ where: movementServiceWhere }),
      this.prisma.billingEvent.count({ where: billingEventWhere }),
      this.prisma.billingEvent.count({
        where: { ...billingEventWhere, status: { in: ['failed', 'rejected'] } },
      }),
      this.prisma.billingEvent.count({
        where: { ...billingEventWhere, status: { in: ['draft', 'ready', 'on_hold'] } },
      }),
      this.prisma.billingExportBatch.count({ where: exportBatchWhere }),
      this.prisma.vesselCall.groupBy({
        by: ['status'],
        where: vesselCallWhere,
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.vesselMovement.groupBy({
        by: ['status'],
        where: movementWhere,
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.vesselMovement.groupBy({
        by: ['movementType'],
        where: movementWhere,
        _count: true,
        orderBy: { movementType: 'asc' },
      }),
      this.prisma.vesselCall.groupBy({
        by: ['berthId'],
        where: { ...vesselCallWhere, berthId: { not: null } },
        _count: true,
        orderBy: { _count: { berthId: 'desc' } },
        take: 8,
      }),
      this.prisma.billingEvent.groupBy({
        by: ['status'],
        where: billingEventWhere,
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.movementService.groupBy({
        by: ['status'],
        where: { ...movementServiceWhere, isBillable: true },
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.billingExportBatch.groupBy({
        by: ['status'],
        where: exportBatchWhere,
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.vesselCall.findMany({
        where: {
          ...vesselCallWhere,
          status: { in: ['planned', 'expected', 'arrived'] },
          eta: { not: null },
        },
        orderBy: { eta: 'asc' },
        take: 6,
      }),
      this.prisma.vesselCall.findMany({
        where: {
          ...vesselCallWhere,
          status: { in: ['alongside', 'planned', 'expected'] },
          etd: { not: null },
        },
        orderBy: { etd: 'asc' },
        take: 6,
      }),
      this.prisma.billingEvent.findMany({
        where: { ...billingEventWhere, status: { in: ['draft', 'ready', 'on_hold'] } },
        orderBy: { createdAt: 'asc' },
        take: 6,
      }),
      this.prisma.billingEvent.findMany({
        where: { ...billingEventWhere, status: { in: ['failed', 'rejected'] } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    return {
      vesselCallCount,
      movementCount,
      movementServiceCount,
      billingEventCount,
      failedBillingEventCount,
      readyBillingEventCount,
      exportBatchCount,
      vesselCallsByStatus: vesselCallsByStatus.map((row) =>
        this.toGroupCount(row.status, row._count),
      ),
      movementsByStatus: movementsByStatus.map((row) => this.toGroupCount(row.status, row._count)),
      movementsByType: movementsByType.map((row) =>
        this.toGroupCount(row.movementType, row._count),
      ),
      berthActivity: berthActivity.map((row) =>
        this.toGroupCount(row.berthId ?? 'unassigned', row._count),
      ),
      billingEventsByStatus: billingEventsByStatus.map((row) =>
        this.toGroupCount(row.status, row._count),
      ),
      billableServicesByStatus: billableServicesByStatus.map((row) =>
        this.toGroupCount(row.status, row._count),
      ),
      exportBatchesByStatus: exportBatchesByStatus.map((row) =>
        this.toGroupCount(row.status, row._count),
      ),
      upcomingArrivals: upcomingArrivals.map((row) => ({
        id: row.id,
        reference: row.callReference,
        status: row.status,
        occurredAt: row.eta,
        portId: row.portId,
        berthId: row.berthId,
      })),
      upcomingDepartures: upcomingDepartures.map((row) => ({
        id: row.id,
        reference: row.callReference,
        status: row.status,
        occurredAt: row.etd,
        portId: row.portId,
        berthId: row.berthId,
      })),
      pendingBillingEvents: pendingBillingEvents.map((row) => ({
        id: row.id,
        reference: row.eventReference,
        status: row.status,
        occurredAt: row.createdAt,
      })),
      failedBillingEvents: failedBillingEvents.map((row) => ({
        id: row.id,
        reference: row.eventReference,
        status: row.status,
        occurredAt: row.updatedAt,
      })),
    };
  }

  private buildVesselCallWhere(
    tenantId: string,
    query: NormalizedReportQuery,
  ): Prisma.VesselCallWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.portId ? { portId: query.portId } : {}),
      ...(query.from || query.to ? { eta: this.nullableDateFilter(query) } : {}),
    };
  }

  private buildMovementWhere(
    tenantId: string,
    query: NormalizedReportQuery,
  ): Prisma.VesselMovementWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.portId ? { portId: query.portId } : {}),
      ...(query.from || query.to ? { plannedAt: this.nullableDateFilter(query) } : {}),
    };
  }

  private buildMovementServiceWhere(
    tenantId: string,
    query: NormalizedReportQuery,
  ): Prisma.MovementServiceWhereInput {
    return {
      tenantId,
      ...(query.from || query.to ? { requestedAt: this.nullableDateFilter(query) } : {}),
      ...(query.portId ? { movement: { portId: query.portId } } : {}),
    };
  }

  private buildBillingEventWhere(
    tenantId: string,
    query: NormalizedReportQuery,
  ): Prisma.BillingEventWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.from || query.to ? { createdAt: this.requiredDateFilter(query) } : {}),
      ...(query.portId ? { movementService: { movement: { portId: query.portId } } } : {}),
    };
  }

  private buildExportBatchWhere(
    tenantId: string,
    query: NormalizedReportQuery,
  ): Prisma.BillingExportBatchWhereInput {
    return {
      tenantId,
      ...(query.from || query.to ? { requestedAt: this.requiredDateFilter(query) } : {}),
    };
  }

  private nullableDateFilter(query: NormalizedReportQuery): Prisma.DateTimeNullableFilter {
    return {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {}),
    };
  }

  private requiredDateFilter(query: NormalizedReportQuery): Prisma.DateTimeFilter {
    return {
      ...(query.from ? { gte: query.from } : {}),
      ...(query.to ? { lte: query.to } : {}),
    };
  }

  private toGroupCount(key: string, count: unknown): GroupCount {
    return { key, count: this.toCountNumber(count) };
  }

  private toCountNumber(count: unknown): number {
    if (typeof count === 'number') {
      return count;
    }

    if (count && typeof count === 'object' && '_all' in count && typeof count._all === 'number') {
      return count._all;
    }

    return 0;
  }
}
