import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityPage } from './availability-page';

const vesselId = '11111111-1111-4111-8111-111111111111';
const portId = '22222222-2222-4222-8222-222222222222';
const berthId = '33333333-3333-4333-8333-333333333333';

describe('AvailabilityPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs an advisory availability check', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.includes('/api/v1/vessels')) {
        return Response.json({
          data: [
            {
              id: vesselId,
              tenantId: 'tenant-1',
              name: 'Atlantic Trader',
              imoNumber: '9234567',
              mmsi: null,
              callSign: null,
              vesselType: 'Container Ship',
              grossTonnage: null,
              lengthOverallM: '240',
              maxDraftM: '10',
              status: 'active',
              createdAt: '2026-07-01T00:00:00.000Z',
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      if (url.includes('/api/v1/ports')) {
        return Response.json({
          data: [
            {
              id: portId,
              tenantId: 'tenant-1',
              countryId: 'country-1',
              unlocode: 'GBLIV',
              name: 'Port of Liverpool',
              timeZone: 'Europe/London',
              status: 'active',
              createdAt: '2026-07-01T00:00:00.000Z',
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      if (url.includes('/api/v1/berths')) {
        return Response.json({
          data: [
            {
              id: berthId,
              tenantId: 'tenant-1',
              terminalId: 'terminal-1',
              code: 'L2-01',
              name: 'Liverpool 2 Berth 1',
              maxLengthM: '400',
              maxDraftM: '16',
              status: 'active',
              createdAt: '2026-07-01T00:00:00.000Z',
              updatedAt: '2026-07-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      if (url.includes('/api/v1/availability/check') && init?.method === 'POST') {
        return Response.json({
          id: 'check-1',
          tenantId: 'tenant-1',
          bookingRequestId: null,
          vesselId,
          portId,
          berthId,
          requestedEta: '2026-07-06T10:00:00.000Z',
          requestedEtd: '2026-07-07T10:00:00.000Z',
          result: 'available',
          score: 100,
          summary: 'Availability looks suitable for port review.',
          checks: {
            berthWindow: { status: 'pass', message: '1 candidate berth is free.' },
            vesselDimensions: { status: 'pass', message: 'Length is within limit.' },
            draft: { status: 'pass', message: 'Draft is within limit.' },
            cargoRestrictions: { status: 'pass', message: 'No hazardous cargo restriction.' },
            serviceAvailability: { status: 'pass', message: 'No services requested.' },
          },
          recommendedBerthIds: [berthId],
          blockingReasons: [],
          warnings: [],
          createdAt: '2026-07-06T09:00:00.000Z',
        });
      }

      if (url.includes('/api/v1/booking-requests') && init?.method === 'POST') {
        return Response.json({
          id: 'booking-1',
          tenantId: 'tenant-1',
          requestReference: 'BR-2026-0001',
          vesselId,
          portId,
          preferredBerthId: berthId,
          agentOrganizationId: null,
          customerOrganizationId: null,
          vesselCallId: null,
          status: 'draft',
          requestedEta: '2026-07-06T10:00:00.000Z',
          requestedEtd: '2026-07-07T10:00:00.000Z',
          voyageNumber: null,
          cargoSummary: null,
          remarks: null,
          createdAt: '2026-07-06T09:00:00.000Z',
          updatedAt: '2026-07-06T09:00:00.000Z',
          submittedAt: null,
          reviewedAt: null,
        });
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<AvailabilityPage />);

    await screen.findByDisplayValue('Atlantic Trader · 9234567');

    fireEvent.change(screen.getByLabelText('Requested ETA'), {
      target: { value: '2026-07-06T10:00' },
    });
    fireEvent.change(screen.getByLabelText('Requested ETD'), {
      target: { value: '2026-07-07T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check availability' }));

    expect(await screen.findByText('Availability result')).toBeInTheDocument();
    expect(screen.getByText('Availability looks suitable for port review.')).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/availability/check'),
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create booking request' }));

    await waitFor(() => {
      const bookingCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes('/api/v1/booking-requests') && init?.method === 'POST',
      );

      expect(bookingCall).toBeDefined();
      expect(JSON.parse(String(bookingCall?.[1]?.body))).toMatchObject({
        vesselId,
        portId,
        preferredBerthId: null,
        requestedEta: '2026-07-06T10:00:00.000Z',
        requestedEtd: '2026-07-07T10:00:00.000Z',
      });
    });
    expect(await screen.findByRole('link', { name: 'View booking queue' })).toHaveAttribute(
      'href',
      '/booking-requests',
    );
  });
});
