import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PortsPage } from './ports-page';

describe('PortsPage', () => {
  it('renders ports returned by the REST API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              tenantId: '11111111-1111-4111-8111-111111111111',
              countryId: '55555555-5555-4555-8555-555555555555',
              unlocode: 'GBLGP',
              name: 'London Gateway Port',
              timeZone: 'Europe/London',
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        }),
      }),
    );

    render(<PortsPage />);

    await waitFor(() => {
      expect(screen.getByText('London Gateway Port')).toBeInTheDocument();
    });
    expect(screen.getByText('GBLGP')).toBeInTheDocument();
  });
});
