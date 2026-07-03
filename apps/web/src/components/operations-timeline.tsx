import Link from 'next/link';

type Operation = {
  readonly time: string;
  readonly title: string;
  readonly detail: string;
  readonly href?: string;
};

export function OperationsTimeline({
  operations,
  emptyMessage = 'No active operational records.',
}: Readonly<{
  operations: readonly Operation[];
  emptyMessage?: string;
}>) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">Today&apos;s movement board</h2>
          <p className="mt-1 text-sm text-steel">
            Live operational sequence for port-call control.
          </p>
        </div>
      </div>

      {operations.length > 0 ? (
        <ol className="mt-5 divide-y divide-slate-100">
          {operations.map((operation) => (
            <li
              key={`${operation.time}-${operation.title}`}
              className="grid gap-3 py-4 sm:grid-cols-[5rem_1fr]"
            >
              <time className="text-sm font-semibold text-harbor">{operation.time}</time>
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {operation.href ? (
                    <Link
                      href={operation.href}
                      className="rounded-sm hover:text-harbor focus:outline-none focus:ring-2 focus:ring-harbor/30"
                    >
                      {operation.title}
                    </Link>
                  ) : (
                    operation.title
                  )}
                </h3>
                <p className="mt-1 text-sm leading-6 text-steel">{operation.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-steel">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
