import type { ReactNode } from 'react';

type EmptyStateProps = {
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-steel">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
