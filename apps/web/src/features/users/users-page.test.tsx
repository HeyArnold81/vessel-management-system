import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UsersPage } from './users-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('UsersPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders users and assignable roles returned by the API', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/api/v1/roles')) {
        return Response.json({
          data: [
            {
              id: roleId,
              tenantId,
              code: 'marine_planner',
              name: 'Marine Planner',
              description: null,
              isSystemRole: false,
              permissions: [],
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
            email: 'planner@example.com',
            displayName: 'Marine Planner',
            authProvider: 'local',
            externalSubject: null,
            status: 'active',
            roles: [
              { id: roleId, code: 'marine_planner', name: 'Marine Planner', isSystemRole: false },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ],
        meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
      });
    });

    render(<UsersPage />);

    await waitFor(() => expect(screen.getByText('planner@example.com')).toBeInTheDocument());
    expect(screen.getAllByText('Marine Planner')[0]).toBeInTheDocument();
    expect(screen.getAllByText('local')[0]).toBeInTheDocument();
    expect(screen.getAllByText('active')[0]).toBeInTheDocument();
  });
});
