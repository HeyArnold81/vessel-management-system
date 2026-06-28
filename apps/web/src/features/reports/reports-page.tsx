'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  ReportActivityItem,
  ReportCountBreakdown,
  ReportMetric,
  ReportsOverviewRecord,
} from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { getReportsOverview } from './api';

const emptyOverview: ReportsOverviewRecord = {
  generatedAt: '',
  filters: { from: null, to: null, portId: null },
  operations: {
    metrics: [],
    vesselCallsByStatus: [],
    movementsByStatus: [],
    movementsByType: [],
    berthActivity: [],
    upcomingArrivals: [],
    upcomingDepartures: [],
  },
  billing: {
    metrics: [],
    billingEventsByStatus: [],
    billableServicesByStatus: [],
    exportBatchesByStatus: [],
    pendingBillingEvents: [],
    failedBillingEvents: [],
  },
};

export function ReportsPage() {
  const defaultRange = useMemo(() => buildDefaultRange(), []);
  const [overview, setOverview] = useState(emptyOverview);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [portId, setPortId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getReportsOverview({
        from: toIsoStart(from),
        to: toIsoEnd(to),
        portId: portId.trim() || undefined,
      });
      setOverview(result);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load reports.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
    // The initial load intentionally uses the default range created once for this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    const csv = buildCsv(overview);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `vms-reports-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-line pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Management reporting
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Reports</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
              Operational and billing visibility across vessel calls, movements, marine services,
              and ERP billing readiness.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-line bg-panel p-4 shadow-panel md:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto]">
            <Field label="From">
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Port id">
              <input
                value={portId}
                onChange={(event) => setPortId(event.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </Field>
            <button
              type="button"
              onClick={() => void loadOverview()}
              className="self-end rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="self-end rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink"
            >
              Export CSV
            </button>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          {[...overview.operations.metrics, ...overview.billing.metrics].map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </section>

        {isLoading ? (
          <p className="rounded-lg border border-line bg-panel p-6 text-center text-sm text-steel">
            Loading reports...
          </p>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-2">
          <ReportPanel
            title="Vessel calls by status"
            items={overview.operations.vesselCallsByStatus}
          />
          <ReportPanel title="Movements by status" items={overview.operations.movementsByStatus} />
          <ReportPanel title="Movements by type" items={overview.operations.movementsByType} />
          <ReportPanel title="Berth activity" items={overview.operations.berthActivity} />
          <ReportPanel
            title="Billing events by status"
            items={overview.billing.billingEventsByStatus}
          />
          <ReportPanel
            title="Billable services by status"
            items={overview.billing.billableServicesByStatus}
          />
          <ReportPanel
            title="ERP exports by status"
            items={overview.billing.exportBatchesByStatus}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <ActivityTable title="Upcoming arrivals" items={overview.operations.upcomingArrivals} />
          <ActivityTable
            title="Upcoming departures"
            items={overview.operations.upcomingDepartures}
          />
          <ActivityTable
            title="Pending billing events"
            items={overview.billing.pendingBillingEvents}
          />
          <ActivityTable
            title="Failed billing events"
            items={overview.billing.failedBillingEvents}
          />
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="grid gap-1 text-sm font-medium text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ metric }: Readonly<{ metric: ReportMetric }>) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{metric.label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{metric.value}</p>
    </div>
  );
}

function ReportPanel({
  title,
  items,
}: Readonly<{ title: string; items: readonly ReportCountBreakdown[] }>) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.key} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{item.label}</span>
              <span className="text-steel">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded bg-harbor"
                style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-steel">No report data for this range.</p>
        ) : null}
      </div>
    </section>
  );
}

function ActivityTable({
  title,
  items,
}: Readonly<{ title: string; items: readonly ReportActivityItem[] }>) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-steel">
              <th className="py-3 pr-4">Reference</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-4 font-semibold text-ink">{item.reference}</td>
                <td className="py-3 pr-4 text-steel">{item.status}</td>
                <td className="py-3 text-steel">{formatDateTime(item.occurredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-steel">No activity for this range.</p>
        ) : null}
      </div>
    </section>
  );
}

function buildDefaultRange() {
  const to = new Date();
  const from = new Date();

  from.setDate(to.getDate() - 30);

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toIsoStart(value: string): string | undefined {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toIsoEnd(value: string): string | undefined {
  return value ? `${value}T23:59:59.999Z` : undefined;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildCsv(overview: ReportsOverviewRecord): string {
  const rows = [
    ['Section', 'Name', 'Value'],
    ...overview.operations.metrics.map((item) => ['Operations', item.label, String(item.value)]),
    ...overview.billing.metrics.map((item) => ['Billing', item.label, String(item.value)]),
    ...overview.operations.vesselCallsByStatus.map((item) => [
      'Vessel calls by status',
      item.label,
      String(item.count),
    ]),
    ...overview.operations.movementsByStatus.map((item) => [
      'Movements by status',
      item.label,
      String(item.count),
    ]),
    ...overview.operations.movementsByType.map((item) => [
      'Movements by type',
      item.label,
      String(item.count),
    ]),
    ...overview.billing.billingEventsByStatus.map((item) => [
      'Billing events by status',
      item.label,
      String(item.count),
    ]),
  ];

  return rows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n');
}
