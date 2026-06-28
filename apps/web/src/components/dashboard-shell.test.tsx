import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardShell } from './dashboard-shell';

describe('DashboardShell', () => {
  it('renders the enterprise vessel operations dashboard', () => {
    render(<DashboardShell />);

    expect(screen.getByRole('heading', { name: 'Vessel Management System' })).toBeInTheDocument();
    expect(screen.getByText('Active port calls')).toBeInTheDocument();
    expect(screen.getByText('MV Atlantic Meridian inbound pilotage')).toBeInTheDocument();
    expect(screen.getByText('RBAC plus vessel-level policies')).toBeInTheDocument();
  });
});
