'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  dashboardMetrics,
  productName,
  type DashboardMetric,
  type ReportActivityItem,
  type ReportsOverviewRecord,
} from '@vms/shared';

import { getReportsOverview } from '@/features/reports/api';
import { ApiClientError } from '@/lib/api/http';

import { MetricCard } from './metric-card';
import { OperationsTimeline } from './operations-timeline';

export function DashboardShell() {
  const [overview, setOverview] = useState<ReportsOverviewRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setIsLoading(true);
      setError(null);

      try {
        setOverview(await getReportsOverview({}));
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load command center data.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOverview();
  }, []);

  const metrics = useMemo(() => toDashboardMetrics(overview), [overview]);
  const operations = useMemo(() => toOperations(overview), [overview]);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Command center
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink sm:text-4xl">{productName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Monitor vessel calls, service readiness, billing exceptions, and operational risk from
              one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/berth-board"
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-harbor"
            >
              Open berth board
            </Link>
            <Link
              href="/vessel-calls"
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-semibold text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-harbor"
            >
              Manage vessel calls
            </Link>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section
          className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Operations metrics"
        >
          {dashboardMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              metric={metrics.find((liveMetric) => liveMetric.label === metric.label) ?? metric}
            />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <OperationsTimeline
            operations={operations}
            emptyMessage={
              isLoading
                ? 'Loading live records...'
                : 'No active movement, billing, or arrival records need attention.'
            }
          />

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Operational controls</h2>
            <div className="mt-4 space-y-4">
              <ControlRow label="Authorization" value="RBAC plus vessel-level policies" />
              <ControlRow label="Audit logging" value="Append-only operational event trail" />
              <ControlRow label="Data model" value="Tenant-scoped PostgreSQL schema" />
              <ControlRow label="AI boundary" value="Backend-only provider access" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function toDashboardMetrics(overview: ReportsOverviewRecord | null): readonly DashboardMetric[] {
  if (!overview) {
    return dashboardMetrics;
  }

  const activeCalls = countByKeys(overview.operations.vesselCallsByStatus, [
    'planned',
    'expected',
    'arrived',
    'alongside',
  ]);
  const activeMovements = countByKeys(overview.operations.movementsByStatus, [
    'planned',
    'scheduled',
    'in_progress',
  ]);
  const pendingServices = countByKeys(overview.billing.billableServicesByStatus, [
    'requested',
    'scheduled',
    'in_progress',
    'on_hold',
  ]);
  const berthConflicts = countBerthConflicts([
    ...overview.operations.upcomingArrivals,
    ...overview.operations.upcomingDepartures,
  ]);
  const billingReady = getMetricValue(overview.billing.metrics, 'pending_billing');

  return [
    {
      label: 'Active port calls',
      value: String(activeCalls),
      status: activeCalls > 0 ? 'in_progress' : 'completed',
      trend: `${overview.operations.upcomingArrivals.length} arrivals and ${overview.operations.upcomingDepartures.length} departures on the board`,
    },
    {
      label: 'Berth conflicts',
      value: String(berthConflicts),
      status: berthConflicts > 0 ? 'attention' : 'completed',
      trend:
        berthConflicts > 0
          ? 'Potential berth timing overlaps need review'
          : 'No berth timing overlaps in the active board',
    },
    {
      label: 'Services pending',
      value: String(pendingServices + activeMovements),
      status: pendingServices + activeMovements > 0 ? 'planned' : 'completed',
      trend: `${pendingServices} billable services and ${activeMovements} movements pending or active`,
    },
    {
      label: 'Invoices ready',
      value: String(billingReady),
      status: billingReady > 0 ? 'attention' : 'completed',
      trend: `${billingReady} billing events ready, draft, or on hold`,
    },
  ];
}

function toOperations(overview: ReportsOverviewRecord | null) {
  if (!overview) {
    return [];
  }

  return [
    ...overview.operations.upcomingArrivals.map((item) =>
      toOperation(item, 'Arrival', `/vessel-calls?id=${encodeURIComponent(item.id)}`),
    ),
    ...overview.operations.upcomingDepartures.map((item) =>
      toOperation(item, 'Departure', `/vessel-calls?id=${encodeURIComponent(item.id)}`),
    ),
    ...overview.billing.pendingBillingEvents.map((item) =>
      toOperation(item, 'Billing', `/billing-events?id=${encodeURIComponent(item.id)}`),
    ),
    ...overview.billing.failedBillingEvents.map((item) =>
      toOperation(item, 'Exception', `/billing-events?id=${encodeURIComponent(item.id)}`),
    ),
  ]
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .slice(0, 8)
    .map(({ sortKey: _sortKey, ...operation }) => operation);
}

function toOperation(item: ReportActivityItem, category: string, href: string) {
  const occurredAt = item.occurredAt ? new Date(item.occurredAt) : null;

  return {
    sortKey: item.occurredAt ?? item.reference,
    time: occurredAt
      ? occurredAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    title: `${category}: ${item.reference}`,
    detail: `${toTitleCase(item.status)}${item.berthId ? `, berth ${item.berthId}` : ''}`,
    href,
  };
}

function countByKeys(
  items: ReportsOverviewRecord['operations']['vesselCallsByStatus'],
  keys: string[],
) {
  return items
    .filter((item) => keys.includes(item.key))
    .reduce((total, item) => total + item.count, 0);
}

function getMetricValue(items: ReportsOverviewRecord['billing']['metrics'], key: string) {
  return items.find((item) => item.key === key)?.value ?? 0;
}

function countBerthConflicts(items: readonly ReportActivityItem[]) {
  const activities = items
    .filter((item) => item.berthId && item.occurredAt)
    .map((item) => ({
      berthId: item.berthId,
      occurredAt: new Date(item.occurredAt as string).getTime(),
    }))
    .filter((item) => Number.isFinite(item.occurredAt))
    .sort((left, right) =>
      left.berthId === right.berthId
        ? left.occurredAt - right.occurredAt
        : String(left.berthId).localeCompare(String(right.berthId)),
    );

  return activities.reduce((total, activity, index) => {
    const previous = activities[index - 1];

    if (!previous || previous.berthId !== activity.berthId) {
      return total;
    }

    const minutesBetween = Math.abs(activity.occurredAt - previous.occurredAt) / 60000;

    return minutesBetween <= 60 ? total + 1 : total;
  }, 0);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function ControlRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="border-l-4 border-harbor pl-3">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-steel">{value}</dd>
    </div>
  );
}
