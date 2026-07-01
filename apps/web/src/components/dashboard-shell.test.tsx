import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DashboardShell } from './dashboard-shell';

const reportResponse = {
  generatedAt: '2026-06-29T12:00:00.000Z',
  filters: { from: null, to: null, portId: null },
  operations: {
    metrics: [
      { key: 'vessel_calls', label: 'Vessel calls', value: 4 },
      { key: 'movements', label: 'Movements', value: 4 },
      { key: 'marine_services', label: 'Marine services', value: 3 },
    ],
    vesselCallsByStatus: [
      { key: 'expected', label: 'Expected', count: 1 },
      { key: 'alongside', label: 'Alongside', count: 1 },
    ],
    movementsByStatus: [{ key: 'scheduled', label: 'Scheduled', count: 2 }],
    movementsByType: [{ key: 'arrival', label: 'Arrival', count: 2 }],
    berthActivity: [{ key: 'L2-01', label: 'L2-01', count: 1 }],
    upcomingArrivals: [
      {
        id: 'call-1',
        reference: 'LIV-2026-0002',
        status: 'expected',
        occurredAt: '2026-06-29T10:30:00.000Z',
        portId: 'port-1',
        berthId: 'berth-1',
      },
    ],
    upcomingDepartures: [],
  },
  billing: {
    metrics: [
      { key: 'billing_events', label: 'Billing events', value: 3 },
      { key: 'pending_billing', label: 'Pending billing', value: 2 },
      { key: 'failed_billing', label: 'Failed or rejected', value: 1 },
      { key: 'erp_exports', label: 'ERP exports', value: 1 },
    ],
    billingEventsByStatus: [{ key: 'ready', label: 'Ready', count: 2 }],
    billableServicesByStatus: [{ key: 'scheduled', label: 'Scheduled', count: 1 }],
    exportBatchesByStatus: [{ key: 'created', label: 'Created', count: 1 }],
    pendingBillingEvents: [
      {
        id: 'billing-1',
        reference: 'BILL-LIV-0003',
        status: 'on_hold',
        occurredAt: '2026-06-29T12:45:00.000Z',
      },
    ],
    failedBillingEvents: [],
  },
};

describe('DashboardShell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the enterprise vessel operations dashboard with live report data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => reportResponse,
    } as Response);

    render(<DashboardShell />);

    expect(screen.getByRole('heading', { name: 'Vessel Management System' })).toBeInTheDocument();
    expect(screen.getByText('Active port calls')).toBeInTheDocument();
    expect(await screen.findByText('Arrival: LIV-2026-0002')).toBeInTheDocument();
    expect(screen.getByText('1 arrivals and 0 departures on the board')).toBeInTheDocument();
    expect(screen.getByText('RBAC plus vessel-level policies')).toBeInTheDocument();
  });
});
