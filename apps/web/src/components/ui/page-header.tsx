import type { ReactNode } from 'react';

type PageHeaderProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actions?: ReactNode;
  readonly metadata?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions, metadata }: PageHeaderProps) {
  return (
    <header className="border-b border-line pb-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-harbor">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">{description}</p>
          {metadata ? <div className="mt-3">{metadata}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
