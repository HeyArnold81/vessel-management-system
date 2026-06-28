import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Permission, PermissionGroup } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { MatrixRole, PermissionWithGroup } from './permission.mapper.js';
import type { PermissionsRepository } from './permissions.repository.js';
import { PermissionsService } from './permissions.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const permissionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const groupId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const group: PermissionGroup = {
  id: groupId,
  code: 'operations',
  name: 'Operations',
  description: 'Operational permissions',
  sortOrder: 10,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const permission: PermissionWithGroup = {
  id: permissionId,
  permissionGroupId: groupId,
  permissionGroup: group,
  code: 'movement.read',
  description: 'Read movements',
  resource: 'movement',
  action: 'read',
  isPrivileged: false,
  sortOrder: 10,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildRole(overrides: Partial<MatrixRole> = {}): MatrixRole {
  return {
    id: roleId,
    tenantId,
    code: 'marine_planner',
    name: 'Marine Planner',
    description: null,
    status: 'active',
    isSystemRole: false,
    isPrivileged: false,
    requiresApproval: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    rolePermissions: [{ roleId, permissionId, permission }],
    ...overrides,
  };
}

function buildRepository(overrides: Partial<PermissionsRepository> = {}): PermissionsRepository {
  return {
    listPermissions: vi.fn().mockResolvedValue([permission]),
    listGroups: vi.fn().mockResolvedValue([{ ...group, permissions: [permission] }]),
    listMatrixRoles: vi.fn().mockResolvedValue([buildRole()]),
    findRoleById: vi.fn().mockResolvedValue(buildRole()),
    findPermissions: vi.fn().mockResolvedValue([permission as Permission]),
    updateRolePermissions: vi.fn().mockResolvedValue(buildRole()),
    ...overrides,
  };
}

describe('PermissionsService', () => {
  it('returns a grouped role permission matrix', async () => {
    const service = new PermissionsService(buildRepository(), { record: vi.fn() });

    await expect(service.getMatrix(tenantId)).resolves.toMatchObject({
      groups: [{ code: 'operations', permissions: [{ code: 'movement.read' }] }],
      roles: [{ role: { code: 'marine_planner' }, permissionIds: [permissionId] }],
    });
  });

  it('updates a tenant role permission set and records audit', async () => {
    const audit = { record: vi.fn() };
    const repository = buildRepository();
    const service = new PermissionsService(repository, audit);

    await service.updateRolePermissions(tenantId, roleId, { permissionIds: [permissionId] });

    expect(repository.updateRolePermissions).toHaveBeenCalledWith(tenantId, roleId, [permissionId]);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'permission.role.update', entityId: roleId }),
    );
  });

  it('does not modify system roles', async () => {
    const service = new PermissionsService(
      buildRepository({
        findRoleById: vi.fn().mockResolvedValue(buildRole({ tenantId: null, isSystemRole: true })),
      }),
      { record: vi.fn() },
    );

    await expect(
      service.updateRolePermissions(tenantId, roleId, { permissionIds: [permissionId] }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unknown permissions', async () => {
    const service = new PermissionsService(
      buildRepository({ findPermissions: vi.fn().mockResolvedValue([]) }),
      { record: vi.fn() },
    );

    await expect(
      service.updateRolePermissions(tenantId, roleId, { permissionIds: [permissionId] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
