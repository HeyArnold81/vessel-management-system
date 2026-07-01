import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VesselCallsPage } from './vessel-calls-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const vesselId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const portId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('VesselCallsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockVesselCallApis() {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/vessels')) {
        return Response.json({
          data: [
            {
              id: vesselId,
              tenantId,
              name: 'MV Enterprise',
              imoNumber: '9341234',
              mmsi: null,
              callSign: null,
              vesselType: 'Container Ship',
              grossTonnage: null,
              lengthOverallM: null,
              maxDraftM: null,
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
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
              tenantId,
              countryId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              unlocode: 'GBFXT',
              name: 'Felixstowe',
              timeZone: 'Europe/London',
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
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
            callReference: 'CALL-2026-0001',
            vesselId,
            portId,
            berthId: null,
            agentId: null,
            operatorId: null,
            voyageNumber: 'VOY-7781',
            status: 'expected',
            eta: '2026-07-01T10:00:00.000Z',
            etd: '2026-07-02T18:00:00.000Z',
            ata: null,
            atd: null,
            remarks: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });
  }

  it('renders vessel calls returned by the API', async () => {
    mockVesselCallApis();

    render(<VesselCallsPage />);

    await waitFor(() => expect(screen.getByText('CALL-2026-0001')).toBeInTheDocument());
    expect(screen.getByText('MV Enterprise (9341234)')).toBeInTheDocument();
    expect(screen.getByText('Felixstowe (GBFXT)')).toBeInTheDocument();
  });

  it('opens the vessel call editor from the workspace action', async () => {
    mockVesselCallApis();

    render(<VesselCallsPage />);

    await screen.findByText('CALL-2026-0001');

    expect(screen.queryByRole('button', { name: 'Create call' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New vessel call' }));

    expect(screen.getByRole('heading', { name: 'New vessel call' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create call' })).toBeInTheDocument();
  });
});
