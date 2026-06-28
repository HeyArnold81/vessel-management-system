import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CargoPage } from './cargo-page';

describe('CargoPage', () => {
  it('renders cargo returned by the REST API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              tenantId: '11111111-1111-4111-8111-111111111111',
              cargoCode: 'IRON-ORE',
              name: 'Iron Ore Fines',
              cargoCategory: 'bulk',
              unNumber: null,
              isHazardous: false,
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        }),
      }),
    );

    render(<CargoPage />);

    await waitFor(() => {
      expect(screen.getByText('Iron Ore Fines')).toBeInTheDocument();
    });
    expect(screen.getByText('IRON-ORE')).toBeInTheDocument();
  });
});
