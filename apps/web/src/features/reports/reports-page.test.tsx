import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders report metrics and activity returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        generatedAt: '2026-06-01T00:00:00.000Z',
        filters: {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-30T23:59:59.999Z',
          portId: null,
        },
        operations: {
          metrics: [
            { key: 'vessel_calls', label: 'Vessel calls', value: 4 },
            { key: 'movements', label: 'Movements', value: 3 },
            { key: 'marine_services', label: 'Marine services', value: 2 },
          ],
          vesselCallsByStatus: [{ key: 'planned', label: 'Planned', count: 2 }],
          movementsByStatus: [{ key: 'completed', label: 'Completed', count: 1 }],
          movementsByType: [{ key: 'arrival', label: 'Arrival', count: 1 }],
          berthActivity: [{ key: 'berth-1', label: 'Berth 1', count: 1 }],
          upcomingArrivals: [
            {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              reference: 'VC-001',
              status: 'planned',
              occurredAt: '2026-06-10T10:00:00.000Z',
              portId: null,
              berthId: null,
            },
          ],
          upcomingDepartures: [],
        },
        billing: {
          metrics: [
            { key: 'billing_events', label: 'Billing events', value: 2 },
            { key: 'pending_billing', label: 'Pending billing', value: 1 },
            { key: 'failed_billing', label: 'Failed or rejected', value: 1 },
            { key: 'erp_exports', label: 'ERP exports', value: 1 },
          ],
          billingEventsByStatus: [{ key: 'ready', label: 'Ready', count: 1 }],
          billableServicesByStatus: [{ key: 'completed', label: 'Completed', count: 1 }],
          exportBatchesByStatus: [{ key: 'exported', label: 'Exported', count: 1 }],
          pendingBillingEvents: [],
          failedBillingEvents: [],
        },
      }),
    );

    render(<ReportsPage />);

    await waitFor(() => expect(screen.getByText('Vessel calls')).toBeInTheDocument());
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('VC-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  });
});
