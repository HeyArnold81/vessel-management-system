import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MovementServicesPage } from './movement-services-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const movementId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const serviceId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

describe('MovementServicesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockMovementServiceApis() {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/movements')) {
        return Response.json({
          data: [
            {
              id: movementId,
              tenantId,
              movementReference: 'MOVE-2026-0001',
              vesselCallId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              vesselId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
              portId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
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
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });
  }

  it('renders movement services returned by the API', async () => {
    mockMovementServiceApis();

    render(<MovementServicesPage />);

    await waitFor(() =>
      expect(screen.getByText('Harbour Pilotage (PILOTAGE)')).toBeInTheDocument(),
    );
    expect(screen.getAllByText('MOVE-2026-0001 · arrival')[0]).toBeInTheDocument();
    expect(screen.getByText('1 job')).toBeInTheDocument();
  });

  it('opens the movement service editor from the workspace action', async () => {
    mockMovementServiceApis();

    render(<MovementServicesPage />);

    await screen.findByText('Harbour Pilotage (PILOTAGE)');

    expect(screen.queryAllByRole('button', { name: 'Attach service' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Attach service' }));

    expect(screen.getByRole('heading', { name: 'Attach service' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Attach service' })).toHaveLength(2);
  });

  it('opens the movement service editor from the table row', async () => {
    mockMovementServiceApis();

    render(<MovementServicesPage />);

    await screen.findByText('Harbour Pilotage (PILOTAGE)');

    fireEvent.click(screen.getByRole('row', { name: /Harbour Pilotage/ }));

    expect(screen.getByRole('heading', { name: 'Edit movement service' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });
});
