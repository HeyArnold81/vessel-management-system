import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServicesPage } from './services-page';

const tenantId = '11111111-1111-4111-8111-111111111111';

describe('ServicesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders services returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        data: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      }),
    );

    render(<ServicesPage />);

    await waitFor(() => expect(screen.getByText('Harbour Pilotage')).toBeInTheDocument());
    expect(screen.getByText('PILOTAGE')).toBeInTheDocument();
    expect(screen.getAllByText('pilotage')[0]).toBeInTheDocument();
  });
});
