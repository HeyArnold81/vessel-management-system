import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BillingEventsPage } from './billing-events-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const movementServiceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('BillingEventsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ERP billing events returned by the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/movement-services')) {
        return Response.json({
          data: [
            {
              id: movementServiceId,
              tenantId,
              movementId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              serviceId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              providerOrganizationId: null,
              status: 'completed',
              quantity: '1',
              unitOfMeasure: 'job',
              requestedAt: '2026-07-01T10:00:00.000Z',
              completedAt: '2026-07-01T12:00:00.000Z',
              isBillable: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      return Response.json({
        data: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            tenantId,
            eventReference: 'BILL-2026-0001',
            movementServiceId,
            status: 'ready',
            erpSystem: 'SAP',
            exportBatchId: null,
            exportedAt: null,
            acceptedAt: null,
            rejectedAt: null,
            failureReason: null,
            payload: {
              source: { movementServiceId },
              service: {
                quantity: '1',
                unitOfMeasure: 'job',
                completedAt: '2026-07-01T12:00:00.000Z',
                isBillable: true,
              },
              erp: { documentType: 'billing_request', version: '1.0' },
              snapshot: { movementServiceId },
            },
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });

    render(<BillingEventsPage initialSearch="BILL-2026-0001" />);

    await waitFor(() => expect(screen.getByText('BILL-2026-0001')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('search=BILL-2026-0001'),
      expect.any(Object),
    );
    expect(screen.getByDisplayValue('BILL-2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('ready')[0]).toBeInTheDocument();
    expect(screen.getByText('SAP')).toBeInTheDocument();
    expect(screen.getAllByText('1 job · completed')[0]).toBeInTheDocument();
  });
});
