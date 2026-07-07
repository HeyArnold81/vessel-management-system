import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BookingRequestsPage } from './booking-requests-page';

describe('BookingRequestsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders booking requests returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        data: [
          {
            id: 'booking-1',
            tenantId: 'tenant-1',
            requestReference: 'BR-2026-0001',
            vesselId: 'vessel-1',
            portId: 'port-1',
            preferredBerthId: null,
            agentOrganizationId: null,
            customerOrganizationId: null,
            vesselCallId: null,
            status: 'submitted',
            requestedEta: '2026-07-06T10:00:00.000Z',
            requestedEtd: '2026-07-07T10:00:00.000Z',
            voyageNumber: 'VOY-1',
            cargoSummary: null,
            remarks: null,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
            submittedAt: '2026-07-01T00:00:00.000Z',
            reviewedAt: null,
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      }),
    );

    render(<BookingRequestsPage />);

    expect(await screen.findByText('BR-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Voyage VOY-1')).toBeInTheDocument();
    expect(screen.getByText('Not confirmed')).toBeInTheDocument();
  });
});
