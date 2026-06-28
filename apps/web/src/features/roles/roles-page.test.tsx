import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RolesPage } from './roles-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const permissionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('RolesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders roles and permissions returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/roles/permissions')) {
        return Response.json([
          {
            id: permissionId,
            code: 'movement.read',
            description: 'Read movements',
          },
        ]);
      }

      return Response.json({
        data: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            tenantId,
            code: 'marine_planner',
            name: 'Marine Planner',
            description: null,
            isSystemRole: false,
            permissions: [
              { id: permissionId, code: 'movement.read', description: 'Read movements' },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });

    render(<RolesPage />);

    await waitFor(() => expect(screen.getAllByText('Marine Planner')[0]).toBeInTheDocument());
    expect(screen.getAllByText('marine_planner')[0]).toBeInTheDocument();
    expect(screen.getByText('movement.read')).toBeInTheDocument();
    expect(screen.getByText('Tenant')).toBeInTheDocument();
  });
});
