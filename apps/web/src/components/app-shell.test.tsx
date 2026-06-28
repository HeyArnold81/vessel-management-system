import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppShell } from './app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/vessels',
}));

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders enterprise navigation and page content', () => {
    render(
      <AppShell>
        <div>Workspace content</div>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: /Vessels/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ERP Exports' })).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Workspace content')).toBeInTheDocument();
  });

  it('opens shortcut help from the keyboard', () => {
    render(
      <AppShell>
        <div>Workspace content</div>
      </AppShell>,
    );

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
  });
});
