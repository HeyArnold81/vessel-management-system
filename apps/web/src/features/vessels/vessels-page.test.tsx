import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VesselsPage } from './vessels-page';

describe('VesselsPage', () => {
  it('renders vessels returned by the REST API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: '22222222-2222-4222-8222-222222222222',
              tenantId: '11111111-1111-4111-8111-111111111111',
              name: 'MV Atlantic Meridian',
              imoNumber: '9321483',
              mmsi: '235123456',
              callSign: 'MAZU7',
              vesselType: 'Container Ship',
              grossTonnage: '54210',
              lengthOverallM: '294.1',
              maxDraftM: '12.4',
              status: 'active',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
        }),
      }),
    );

    render(<VesselsPage />);

    await waitFor(() => {
      expect(screen.getByText('MV Atlantic Meridian')).toBeInTheDocument();
    });
    expect(screen.getByText('9321483')).toBeInTheDocument();
  });
});
