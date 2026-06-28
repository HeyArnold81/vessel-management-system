import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PermissionsPage } from './permissions-page';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const systemRoleId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const permissionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const groupId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const permission = {
  id: permissionId,
  permissionGroupId: groupId,
  code: 'movement.read',
  description: 'Read movements',
  resource: 'movement',
  action: 'read',
  isPrivileged: false,
  sortOrder: 10,
};

describe('PermissionsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the matrix and updates tenant role permissions', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);

      if (url.includes(`/api/v1/permissions/roles/${roleId}`) && init?.method === 'PUT') {
        return Response.json({
          id: roleId,
          tenantId,
          code: 'marine_planner',
          name: 'Marine Planner',
          description: null,
          status: 'active',
          isSystemRole: false,
          isPrivileged: false,
          requiresApproval: false,
          permissions: [permission],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
        });
      }

      return Response.json({
        groups: [
          {
            id: groupId,
            code: 'operations',
            name: 'Operations',
            description: 'Operational permissions',
            sortOrder: 10,
            permissions: [permission],
          },
        ],
        roles: [
          {
            role: {
              id: roleId,
              tenantId,
              code: 'marine_planner',
              name: 'Marine Planner',
              description: null,
              status: 'active',
              isSystemRole: false,
              isPrivileged: false,
              requiresApproval: false,
              permissions: [],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
              deletedAt: null,
            },
            permissionIds: [],
          },
          {
            role: {
              id: systemRoleId,
              tenantId: null,
              code: 'system_administrator',
              name: 'System Administrator',
              description: null,
              status: 'active',
              isSystemRole: true,
              isPrivileged: true,
              requiresApproval: true,
              permissions: [permission],
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-02T00:00:00.000Z',
              deletedAt: null,
            },
            permissionIds: [permissionId],
          },
        ],
      });
    });

    render(<PermissionsPage />);

    await waitFor(() => expect(screen.getAllByText('Marine Planner')[0]).toBeInTheDocument());
    expect(screen.getByText('Operations')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('movement.read for Marine Planner'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/permissions/roles/${roleId}`),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
