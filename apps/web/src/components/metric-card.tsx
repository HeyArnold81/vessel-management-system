import clsx from 'clsx';

import { type DashboardMetric, getStatusLabel } from '@vms/shared';

const statusStyles: Record<DashboardMetric['status'], string> = {
  planned: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-teal-50 text-harbor ring-teal-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  attention: 'bg-amber-50 text-signal ring-amber-200',
};

export function MetricCard({ metric }: Readonly<{ metric: DashboardMetric }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-steel">{metric.label}</h2>
        <span
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
            statusStyles[metric.status],
          )}
        >
          {getStatusLabel(metric.status)}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-ink">{metric.value}</p>
      <p className="mt-3 text-sm leading-6 text-steel">{metric.trend}</p>
    </article>
  );
}
