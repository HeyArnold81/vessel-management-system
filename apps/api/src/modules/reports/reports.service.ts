import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { ReportDateRangeQuery, ReportsOverviewRecord } from '@vms/shared';

import { REPORTS_REPOSITORY, type ReportsRepository } from './reports.repository.js';

const labelMap: Record<string, string> = {
  in_progress: 'In progress',
  on_hold: 'On hold',
  berth_shift: 'Berth shift',
  cargo_operation: 'Cargo operation',
  vessel_call: 'Vessel call',
};

@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly repository: ReportsRepository,
  ) {}

  async getOverview(tenantId: string, query: ReportDateRangeQuery): Promise<ReportsOverviewRecord> {
    const normalizedQuery = this.normalizeQuery(query);
    const data = await this.repository.getOverviewData(tenantId, normalizedQuery);

    return {
      generatedAt: new Date().toISOString(),
      filters: {
        from: normalizedQuery.from?.toISOString() ?? null,
        to: normalizedQuery.to?.toISOString() ?? null,
        portId: normalizedQuery.portId ?? null,
      },
      operations: {
        metrics: [
          { key: 'vessel_calls', label: 'Vessel calls', value: data.vesselCallCount },
          { key: 'movements', label: 'Movements', value: data.movementCount },
          {
            key: 'marine_services',
            label: 'Marine services',
            value: data.movementServiceCount,
          },
        ],
        vesselCallsByStatus: data.vesselCallsByStatus.map(this.withLabel),
        movementsByStatus: data.movementsByStatus.map(this.withLabel),
        movementsByType: data.movementsByType.map(this.withLabel),
        berthActivity: data.berthActivity.map((item) => ({
          ...item,
          label: item.key === 'unassigned' ? 'Unassigned berth' : item.key,
        })),
        upcomingArrivals: data.upcomingArrivals.map(this.toActivityItem),
        upcomingDepartures: data.upcomingDepartures.map(this.toActivityItem),
      },
      billing: {
        metrics: [
          { key: 'billing_events', label: 'Billing events', value: data.billingEventCount },
          {
            key: 'pending_billing',
            label: 'Pending billing',
            value: data.readyBillingEventCount,
          },
          {
            key: 'failed_billing',
            label: 'Failed or rejected',
            value: data.failedBillingEventCount,
          },
          { key: 'erp_exports', label: 'ERP exports', value: data.exportBatchCount },
        ],
        billingEventsByStatus: data.billingEventsByStatus.map(this.withLabel),
        billableServicesByStatus: data.billableServicesByStatus.map(this.withLabel),
        exportBatchesByStatus: data.exportBatchesByStatus.map(this.withLabel),
        pendingBillingEvents: data.pendingBillingEvents.map(this.toActivityItem),
        failedBillingEvents: data.failedBillingEvents.map(this.toActivityItem),
      },
    };
  }

  private normalizeQuery(query: ReportDateRangeQuery) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Report from date is invalid.');
    }

    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Report to date is invalid.');
    }

    if (from && to && from > to) {
      throw new BadRequestException('Report from date must be before to date.');
    }

    return {
      from,
      to,
      portId: query.portId?.trim() || undefined,
    };
  }

  private withLabel(item: { readonly key: string; readonly count: number }) {
    return {
      ...item,
      label: labelMap[item.key] ?? ReportsService.toTitleCase(item.key),
    };
  }

  private toActivityItem(item: {
    readonly id: string;
    readonly reference: string;
    readonly status: string;
    readonly occurredAt: Date | null;
    readonly portId?: string | null;
    readonly berthId?: string | null;
  }) {
    return {
      id: item.id,
      reference: item.reference,
      status: item.status,
      occurredAt: item.occurredAt?.toISOString() ?? null,
      portId: item.portId,
      berthId: item.berthId,
    };
  }

  private static toTitleCase(value: string): string {
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }
}
