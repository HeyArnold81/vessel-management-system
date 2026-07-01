import clsx from 'clsx';

type StatusBadgeProps = {
  readonly status: string;
};

const statusStyles: Record<string, string> = {
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40',
  alongside: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40',
  arrived: 'border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-950/40',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40',
  departed: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800',
  draft: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800',
  expected: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40',
  exported: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40',
  failed: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40',
  inactive: 'border-slate-200 bg-slate-50 text-slate-600 dark:bg-slate-800',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40',
  on_hold: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40',
  planned: 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800',
  ready: 'border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-950/40',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40',
  scheduled: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40',
  suspended: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize',
        statusStyles[normalizedStatus] ??
          'border-line bg-surface text-steel dark:border-line dark:bg-panel',
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}
