import type { ReactNode } from 'react';

type ActionMenuProps = {
  readonly label?: string;
  readonly children: ReactNode;
};

export function ActionMenu({ label = 'Actions', children }: ActionMenuProps) {
  return (
    <details
      className="group relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <summary className="list-none rounded-md border border-line bg-panel px-3 py-1.5 text-sm font-semibold text-steel marker:hidden hover:bg-surface focus:outline-none focus:ring-2 focus:ring-harbor/30">
        {label}
      </summary>
      <div className="absolute right-0 z-20 mt-2 min-w-40 overflow-hidden rounded-md border border-line bg-panel py-1 text-left shadow-lg">
        {children}
      </div>
    </details>
  );
}

type ActionMenuItemProps = {
  readonly children: ReactNode;
  readonly destructive?: boolean;
  readonly onClick: () => void;
};

export function ActionMenuItem({ children, destructive = false, onClick }: ActionMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        destructive
          ? 'block w-full px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50'
          : 'block w-full px-3 py-2 text-left text-sm font-medium text-steel hover:bg-surface'
      }
    >
      {children}
    </button>
  );
}
