'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { productName } from '@vms/shared';

type AppShellProps = {
  readonly children: ReactNode;
};

type ShellNavItem = {
  readonly label: string;
  readonly href: string;
  readonly group: 'Operations' | 'Master Data' | 'Billing' | 'Administration';
  readonly shortcut?: string;
  readonly disabled?: boolean;
};

const navigation: readonly ShellNavItem[] = [
  { label: 'Command Center', href: '/', group: 'Operations', shortcut: 'G D' },
  { label: 'AI Assistant', href: '/ai-assistant', group: 'Operations' },
  { label: 'Availability', href: '/availability', group: 'Operations' },
  { label: 'Booking Requests', href: '/booking-requests', group: 'Operations' },
  { label: 'Vessel Calls', href: '/vessel-calls', group: 'Operations', shortcut: 'G C' },
  { label: 'Berth Board', href: '/berth-board', group: 'Operations', shortcut: 'G B' },
  { label: 'Movements', href: '/movements', group: 'Operations', shortcut: 'G M' },
  { label: 'Movement Services', href: '/movement-services', group: 'Operations' },
  { label: 'Vessels', href: '/vessels', group: 'Master Data', shortcut: 'G V' },
  { label: 'Ports', href: '/ports', group: 'Master Data' },
  { label: 'Berths', href: '/berths', group: 'Master Data' },
  { label: 'Cargo', href: '/cargo', group: 'Master Data' },
  { label: 'Service Catalog', href: '/services', group: 'Master Data' },
  { label: 'Billing Events', href: '/billing-events', group: 'Billing' },
  { label: 'ERP Exports', href: '/billing-export-batches', group: 'Billing' },
  { label: 'Reports', href: '/reports', group: 'Administration' },
  { label: 'Users', href: '/users', group: 'Administration' },
  { label: 'Roles', href: '/roles', group: 'Administration' },
  { label: 'Permissions', href: '/permissions', group: 'Administration' },
];

const groups: readonly ShellNavItem['group'][] = [
  'Operations',
  'Master Data',
  'Billing',
  'Administration',
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [query, setQuery] = useState('');

  const activeItem = navigation.find((item) => item.href === pathname) ?? navigation[0];
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return navigation;
    }

    return navigation.filter((item) => item.label.toLowerCase().includes(normalizedQuery));
  }, [query]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('vms-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('vms-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setIsShortcutHelpOpen(false);
        setIsMobileNavOpen(false);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandOpen(true);
      }

      if (event.key === '/' && !isEditable) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === '?' && !isEditable) {
        event.preventDefault();
        setIsShortcutHelpOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function renderNavigation() {
    return (
      <nav aria-label="Primary navigation" className="grid gap-6">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-steel">{group}</p>
            <div className="mt-2 grid gap-1">
              {navigation
                .filter((item) => item.group === group)
                .map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onNavigate={() => setIsMobileNavOpen(false)}
                  />
                ))}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        href="#app-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-panel"
      >
        Skip to content
      </a>

      <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-line bg-panel lg:block">
          <div className="sticky top-0 grid h-screen grid-rows-[auto_1fr_auto] gap-6 px-4 py-5">
            <Link href="/" className="grid gap-1 rounded-md px-2 py-1 focus:outline-none">
              <span className="text-sm font-semibold uppercase tracking-wide text-harbor">VMS</span>
              <span className="text-base font-semibold text-ink">{productName}</span>
            </Link>

            <div className="app-scrollbar overflow-y-auto pr-1">{renderNavigation()}</div>

            <div className="rounded-md border border-line bg-surface p-3 text-xs leading-5 text-steel">
              <p className="font-semibold text-ink">Shortcuts</p>
              <p className="mt-1">Press Ctrl+K for commands or ? for help.</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink lg:hidden"
              >
                Menu
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-steel">
                  {activeItem.group}
                </p>
                <p className="truncate text-sm font-semibold text-ink">{activeItem.label}</p>
              </div>

              <label className="hidden min-w-64 max-w-md flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-steel md:flex">
                <span aria-hidden="true">Search</span>
                <input
                  ref={searchRef}
                  placeholder="Search or press Ctrl+K"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink placeholder:text-steel focus:outline-none"
                  onFocus={() => setIsCommandOpen(true)}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink md:hidden"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => setIsShortcutHelpOpen(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
                aria-label="Open keyboard shortcuts"
              >
                ?
              </button>

              <button
                type="button"
                onClick={() => setIsDark((value) => !value)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
              >
                {isDark ? 'Light' : 'Dark'}
              </button>
            </div>
          </header>

          <div id="app-content" className="min-h-[calc(100vh-4rem)]">
            {children}
          </div>
        </div>
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative grid h-full w-80 max-w-[85vw] grid-rows-[auto_1fr] gap-4 bg-panel p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-ink">{productName}</span>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
              >
                Close
              </button>
            </div>
            <div className="app-scrollbar overflow-y-auto">{renderNavigation()}</div>
          </div>
        </div>
      ) : null}

      {isCommandOpen ? (
        <CommandDialog
          query={query}
          items={filteredItems}
          onQueryChange={setQuery}
          onClose={() => setIsCommandOpen(false)}
        />
      ) : null}

      {isShortcutHelpOpen ? <ShortcutDialog onClose={() => setIsShortcutHelpOpen(false)} /> : null}
    </div>
  );
}

function NavItem({
  item,
  isActive,
  onNavigate,
}: Readonly<{
  item: ShellNavItem;
  isActive: boolean;
  onNavigate: () => void;
}>) {
  if (item.disabled) {
    return (
      <span className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium text-steel opacity-60">
        {item.label}
        <span className="text-xs">Soon</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={clsx(
        'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-harbor',
        isActive ? 'bg-harbor text-white' : 'text-steel hover:bg-surface hover:text-ink',
      )}
    >
      <span>{item.label}</span>
      {item.shortcut ? (
        <span className={clsx('text-xs', isActive ? 'text-white/80' : 'text-steel')}>
          {item.shortcut}
        </span>
      ) : null}
    </Link>
  );
}

function CommandDialog({
  query,
  items,
  onQueryChange,
  onClose,
}: Readonly<{
  query: string;
  items: readonly ShellNavItem[];
  onQueryChange: (value: string) => void;
  onClose: () => void;
}>) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center bg-slate-950/40 px-4 pt-20">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-line bg-panel shadow-xl"
      >
        <div className="border-b border-line p-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search screens"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {items.map((item) =>
            item.disabled ? (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-steel opacity-60"
              >
                <span>{item.label}</span>
                <span className="text-xs">Coming soon</span>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink hover:bg-surface focus:outline-none focus:ring-2 focus:ring-harbor"
              >
                <span>{item.label}</span>
                <span className="text-xs text-steel">{item.group}</span>
              </Link>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function ShortcutDialog({ onClose }: Readonly<{ onClose: () => void }>) {
  const shortcuts = [
    ['/', 'Focus global search'],
    ['Ctrl+K', 'Open command palette'],
    ['?', 'Open shortcut help'],
    ['Esc', 'Close menus and dialogs'],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="w-full max-w-lg rounded-lg border border-line bg-panel p-5 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"
          >
            Close
          </button>
        </div>
        <dl className="mt-4 grid gap-3">
          {shortcuts.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4">
              <dt className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-ink">
                {keys}
              </dt>
              <dd className="text-sm text-steel">{label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
