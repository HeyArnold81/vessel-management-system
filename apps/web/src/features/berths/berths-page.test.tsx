import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BerthsPage } from './berths-page';

const berthResponse = {
  data: [
    {
      id: '77777777-7777-4777-8777-777777777777',
      tenantId: '11111111-1111-4111-8111-111111111111',
      terminalId: '88888888-8888-4888-8888-888888888888',
      code: 'B14',
      name: 'Berth 14',
      maxLengthM: '320',
      maxDraftM: '14.5',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
  ],
  meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
};

describe('BerthsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders berths returned by the REST API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => berthResponse,
      }),
    );

    render(<BerthsPage />);

    await waitFor(() => {
      expect(screen.getByText('Berth 14')).toBeInTheDocument();
    });
    expect(screen.getByText('B14')).toBeInTheDocument();
  });

  it('loads the selected berth into the edit form', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => berthResponse,
      }),
    );

    render(<BerthsPage />);

    await screen.findByText('Berth 14');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByDisplayValue('88888888-8888-4888-8888-888888888888')).toBeInTheDocument();
    expect(screen.getByDisplayValue('B14')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Berth 14')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update berth' })).toBeInTheDocument();
  });
});
