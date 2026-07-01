import type { ReactNode } from 'react';

type SlideOverProps = {
  readonly title: string;
  readonly description?: string;
  readonly isOpen: boolean;
  readonly children: ReactNode;
  readonly onClose: () => void;
};

export function SlideOver({ title, description, isOpen, children, onClose }: SlideOverProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-950/35"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-line bg-panel shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-steel">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
          >
            Close
          </button>
        </div>
        <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
