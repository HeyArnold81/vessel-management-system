import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BillingExportBatchesPage } from './billing-export-batches-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const billingEventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('BillingExportBatchesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ready billing events and existing export batches', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/billing-events')) {
        return Response.json({
          data: [
            {
              id: billingEventId,
              tenantId,
              eventReference: 'BILL-2026-0001',
              movementServiceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              status: 'ready',
              erpSystem: 'SAP',
              exportBatchId: null,
              exportedAt: null,
              acceptedAt: null,
              rejectedAt: null,
              failureReason: null,
              payload: {
                source: { movementServiceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' },
                service: {},
                erp: { documentType: 'billing_request', version: '1.0' },
                snapshot: {},
              },
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
            batchReference: 'ERP-EXPORT-2026-0001',
            status: 'queued',
            erpSystem: 'SAP',
            externalReference: null,
            eventCount: 1,
            payload: {
              erpSystem: 'SAP',
              documentType: 'billing_export_batch',
              version: '1.0',
              billingEventIds: [billingEventId],
              summary: { eventCount: 1 },
            },
            requestedAt: '2026-01-01T00:00:00.000Z',
            completedAt: null,
            failedAt: null,
            failureReason: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });

    render(<BillingExportBatchesPage />);

    await waitFor(() => expect(screen.getByText('ERP-EXPORT-2026-0001')).toBeInTheDocument());
    expect(screen.getByText('BILL-2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('SAP')[0]).toBeInTheDocument();
    expect(screen.getAllByText('queued')[0]).toBeInTheDocument();
  });
});
