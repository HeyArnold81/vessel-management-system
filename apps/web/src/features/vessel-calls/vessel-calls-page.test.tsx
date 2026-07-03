import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VesselCallsPage } from './vessel-calls-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const vesselId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const portId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const vesselCallId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const movementId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const serviceId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('VesselCallsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockVesselCallApis() {
    let serviceDeleted = false;

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
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

      if (url.includes('/api/v1/services')) {
        return Response.json({
          data: [
            {
              id: serviceId,
              tenantId,
              code: 'PILOTAGE',
              name: 'Harbour Pilotage',
              category: 'pilotage',
              defaultUnit: 'job',
              isBillable: true,
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      if (url.includes('/api/v1/movement-services')) {
        if (init?.method === 'DELETE') {
          serviceDeleted = true;

          return Response.json({
            id: '99999999-9999-4999-8999-999999999999',
            tenantId,
            movementId,
            serviceId,
            providerOrganizationId: null,
            status: 'completed',
            quantity: '1',
            unitOfMeasure: 'job',
            requestedAt: '2026-07-01T10:00:00.000Z',
            completedAt: '2026-07-01T12:00:00.000Z',
            isBillable: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          });
        }

        return Response.json({
          data: serviceDeleted
            ? []
            : [
                {
                  id: '99999999-9999-4999-8999-999999999999',
                  tenantId,
                  movementId,
                  serviceId,
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
          meta: { page: 1, pageSize: 100, totalItems: serviceDeleted ? 0 : 1, totalPages: 1 },
        });
      }

      if (url.includes('/api/v1/movements')) {
        return Response.json({
          data: [
            {
              id: movementId,
              tenantId,
              movementReference: 'MOVE-2026-0001',
              vesselCallId,
              vesselId,
              portId,
              fromBerthId: null,
              toBerthId: null,
              movementType: 'arrival',
              status: 'planned',
              plannedAt: '2026-07-01T10:00:00.000Z',
              actualAt: null,
              remarks: null,
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
            id: vesselCallId,
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

    return fetchMock;
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

  it('shows the linked movement and service chain for a vessel call', async () => {
    mockVesselCallApis();

    render(<VesselCallsPage />);

    await screen.findByText('CALL-2026-0001');

    fireEvent.click(screen.getByRole('row', { name: /CALL-2026-0001/ }));

    expect(await screen.findByText('MOVE-2026-0001')).toBeInTheDocument();
    expect(screen.getByText('Harbour Pilotage (PILOTAGE)')).toBeInTheDocument();
    expect(screen.getByText('Vessel call -> movements -> movement services')).toBeInTheDocument();
  });

  it('loads vessel calls using the initial search value', async () => {
    const fetchMock = mockVesselCallApis();

    render(<VesselCallsPage initialSearch="CALL-2026-0001" />);

    await screen.findByText('CALL-2026-0001');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/vessel-calls?'),
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('search=CALL-2026-0001'),
      expect.any(Object),
    );
    expect(screen.getByDisplayValue('CALL-2026-0001')).toBeInTheDocument();
  });

  it('opens movement and service actions from the operational chain', async () => {
    mockVesselCallApis();

    render(<VesselCallsPage />);

    await screen.findByText('CALL-2026-0001');

    fireEvent.click(screen.getByRole('row', { name: /CALL-2026-0001/ }));

    await screen.findByText('MOVE-2026-0001');

    fireEvent.click(screen.getByRole('button', { name: 'Add movement' }));

    expect(screen.getByRole('heading', { name: 'Add movement' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('CALL-2026-0001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Attach service' }));

    expect(screen.getByRole('heading', { name: 'Attach service' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('MOVE-2026-0001 · arrival')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Harbour Pilotage · PILOTAGE')).toBeInTheDocument();
  });

  it('deletes a movement service from the operational chain', async () => {
    mockVesselCallApis();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<VesselCallsPage />);

    await screen.findByText('CALL-2026-0001');

    fireEvent.click(screen.getByRole('row', { name: /CALL-2026-0001/ }));

    expect(await screen.findByText('Harbour Pilotage (PILOTAGE)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete service' }));

    await waitFor(() =>
      expect(screen.queryByText('Harbour Pilotage (PILOTAGE)')).not.toBeInTheDocument(),
    );
    expect(window.confirm).toHaveBeenCalledWith(
      'Delete movement service Harbour Pilotage (PILOTAGE)? This action cannot be undone.',
    );
  });
});
