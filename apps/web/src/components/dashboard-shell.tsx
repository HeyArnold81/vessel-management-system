import { dashboardMetrics, productName } from '@vms/shared';

import { MetricCard } from './metric-card';
import { OperationsTimeline } from './operations-timeline';

const operations = [
  {
    time: '06:30',
    title: 'MV Atlantic Meridian inbound pilotage',
    detail: 'Pilot assigned, two tugs scheduled, berth B-14 confirmed.',
  },
  {
    time: '09:10',
    title: 'Northern Star cargo operations',
    detail: 'Bulk discharge at 62% completion with no reported delays.',
  },
  {
    time: '13:45',
    title: 'Berth C-02 conflict review',
    detail: 'ETA change overlaps a planned shift movement by 35 minutes.',
  },
  {
    time: '17:20',
    title: 'Invoice batch approval',
    detail: 'Nine completed service orders ready for finance approval.',
  },
];

export function DashboardShell() {
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
        </header>

        <section
          className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Operations metrics"
        >
          {dashboardMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <OperationsTimeline operations={operations} />

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

function ControlRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="border-l-4 border-harbor pl-3">
      <dt className="text-sm font-semibold text-ink">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-steel">{value}</dd>
    </div>
  );
}
