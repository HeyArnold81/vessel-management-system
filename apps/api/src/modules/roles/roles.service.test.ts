import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { RoleWithPermissions } from './role.mapper.js';
import type { RolesRepository } from './roles.repository.js';
import { RolesService } from './roles.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const permissionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const permission = {
  id: permissionId,
  permissionGroupId: null,
  permissionGroup: null,
  code: 'movement.read',
  description: 'Read movements',
  resource: 'movement',
  action: 'read',
  isPrivileged: false,
  sortOrder: 10,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildRole(overrides: Partial<RoleWithPermissions> = {}): RoleWithPermissions {
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

function buildRepository(overrides: Partial<RolesRepository> = {}): RolesRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ roles: [buildRole()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildRole()),
    findTenantRoleByCode: vi.fn().mockResolvedValue(null),
    findPermissions: vi.fn().mockResolvedValue([permission]),
    listPermissions: vi.fn().mockResolvedValue([permission]),
    create: vi.fn().mockResolvedValue(buildRole()),
    update: vi.fn().mockResolvedValue(buildRole({ name: 'Updated Role' })),
    softDelete: vi.fn().mockResolvedValue(buildRole({ name: 'Inactive Role' })),
    ...overrides,
  };
}

describe('RolesService', () => {
  it('returns a paginated role list', async () => {
    const service = new RolesService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ code: 'marine_planner', permissions: [{ code: 'movement.read' }] }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate tenant role codes', async () => {
    const service = new RolesService(
      buildRepository({ findTenantRoleByCode: vi.fn().mockResolvedValue(buildRole()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, { code: 'marine_planner', name: 'Marine Planner' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not update system roles', async () => {
    const service = new RolesService(
      buildRepository({
        findById: vi.fn().mockResolvedValue(buildRole({ tenantId: null, isSystemRole: true })),
      }),
      { record: vi.fn() },
    );

    await expect(service.update(tenantId, roleId, { name: 'Changed' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws not found when permission ids are invalid', async () => {
    const service = new RolesService(
      buildRepository({ findPermissions: vi.fn().mockResolvedValue([]) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, {
        code: 'finance_user',
        name: 'Finance User',
        permissionIds: [permissionId],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
