type Operation = {
  readonly time: string;
  readonly title: string;
  readonly detail: string;
};

export function OperationsTimeline({
  operations,
}: Readonly<{
  operations: readonly Operation[];
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

      <ol className="mt-5 divide-y divide-slate-100">
        {operations.map((operation) => (
          <li
            key={`${operation.time}-${operation.title}`}
            className="grid gap-3 py-4 sm:grid-cols-[5rem_1fr]"
          >
            <time className="text-sm font-semibold text-harbor">{operation.time}</time>
            <div>
              <h3 className="text-base font-semibold text-ink">{operation.title}</h3>
              <p className="mt-1 text-sm leading-6 text-steel">{operation.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
