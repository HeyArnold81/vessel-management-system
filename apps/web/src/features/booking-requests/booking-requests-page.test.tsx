import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('confirms an approved booking request into a vessel call', async () => {
    let isConfirmed = false;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/booking-requests/booking-1/confirm')) {
        isConfirmed = true;

        return Response.json({
          bookingRequest: buildBookingRequest({
            status: 'confirmed',
            vesselCallId: 'call-1',
          }),
          vesselCall: {
            id: 'call-1',
            tenantId: 'tenant-1',
            callReference: 'BR-2026-0001',
            vesselId: 'vessel-1',
            portId: 'port-1',
            berthId: null,
            agentId: null,
            operatorId: null,
            voyageNumber: 'VOY-1',
            status: 'planned',
            eta: '2026-07-06T10:00:00.000Z',
            etd: '2026-07-07T10:00:00.000Z',
            ata: null,
            atd: null,
            remarks: null,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
          },
        });
      }

      if (url.includes('/api/v1/booking-requests')) {
        return Response.json({
          data: [
            buildBookingRequest(
              isConfirmed
                ? { status: 'confirmed', vesselCallId: 'call-1' }
                : { status: 'approved' },
            ),
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        });
      }

      return Response.json({}, { status: 404 });
    });

    render(<BookingRequestsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm vessel call' }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/booking-requests/booking-1/confirm'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByRole('link', { name: 'Open vessel call' })).toHaveAttribute(
      'href',
      '/vessel-calls?id=call-1',
    );
  });
});

function buildBookingRequest(
  overrides: Partial<{
    status: string;
    vesselCallId: string | null;
  }> = {},
) {
  return {
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
    ...overrides,
  };
}
