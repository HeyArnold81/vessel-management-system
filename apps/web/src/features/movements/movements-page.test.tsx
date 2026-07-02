import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MovementsPage } from './movements-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const vesselCallId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const vesselId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const portId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('MovementsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockMovementApis() {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/vessel-calls')) {
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
          meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 },
        });
      }

      return Response.json({
        data: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });
  }

  it('renders movements returned by the API', async () => {
    mockMovementApis();

    render(<MovementsPage />);

    await waitFor(() => expect(screen.getByText('MOVE-2026-0001')).toBeInTheDocument());
    expect(screen.getByText('CALL-2026-0001 · expected')).toBeInTheDocument();
    expect(screen.getAllByText('arrival')[0]).toBeInTheDocument();
  });

  it('opens the movement editor from the workspace action', async () => {
    mockMovementApis();

    render(<MovementsPage />);

    await screen.findByText('MOVE-2026-0001');

    expect(screen.queryByRole('button', { name: 'Create movement' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New movement' }));

    expect(screen.getByRole('heading', { name: 'New movement' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create movement' })).toBeInTheDocument();
  });

  it('opens the movement editor from the table row', async () => {
    mockMovementApis();

    render(<MovementsPage />);

    await screen.findByText('MOVE-2026-0001');

    fireEvent.click(screen.getByRole('row', { name: /MOVE-2026-0001/ }));

    expect(screen.getByRole('heading', { name: 'Edit movement' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('MOVE-2026-0001')).toBeInTheDocument();
  });
});
