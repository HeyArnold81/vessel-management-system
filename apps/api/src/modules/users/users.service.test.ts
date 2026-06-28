import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import type { UserWithRoles } from './user.mapper.js';
import type { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const roleId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const role: Role = {
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
};

function buildUser(overrides: Partial<UserWithRoles> = {}): UserWithRoles {
  return {
    id: userId,
    tenantId,
    email: 'planner@example.com',
    displayName: 'Marine Planner',
    authProvider: 'local',
    externalSubject: null,
    passwordHash: null,
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
    roles: [],
    ...overrides,
  };
}

function buildRepository(overrides: Partial<UsersRepository> = {}): UsersRepository {
  return {
    findPage: vi.fn().mockResolvedValue({ users: [buildUser()], totalItems: 1 }),
    findById: vi.fn().mockResolvedValue(buildUser()),
    findByEmail: vi.fn().mockResolvedValue(null),
    findAssignableRole: vi.fn().mockResolvedValue(role),
    create: vi.fn().mockResolvedValue(buildUser()),
    update: vi.fn().mockResolvedValue(buildUser({ displayName: 'Updated Planner' })),
    deactivate: vi
      .fn()
      .mockResolvedValue(buildUser({ status: 'deactivated', deletedAt: new Date() })),
    assignRole: vi.fn().mockResolvedValue(
      buildUser({
        roles: [{ userId, roleId, assignedAt: new Date('2026-01-03T00:00:00.000Z'), role }],
      }),
    ),
    removeRole: vi.fn().mockResolvedValue(buildUser()),
    ...overrides,
  };
}

describe('UsersService', () => {
  it('returns a paginated user list', async () => {
    const service = new UsersService(buildRepository(), { record: vi.fn() });

    await expect(service.list(tenantId, { page: 1, pageSize: 10 })).resolves.toMatchObject({
      data: [{ email: 'planner@example.com', status: 'active' }],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
  });

  it('rejects duplicate user email addresses', async () => {
    const service = new UsersService(
      buildRepository({ findByEmail: vi.fn().mockResolvedValue(buildUser()) }),
      { record: vi.fn() },
    );

    await expect(
      service.create(tenantId, { email: 'planner@example.com', displayName: 'Marine Planner' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records audit when assigning a role', async () => {
    const audit = { record: vi.fn() };
    const service = new UsersService(buildRepository(), audit);

    await service.assignRole(tenantId, userId, { roleId });

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'user.role.assign',
        entityId: userId,
      }),
    );
  });

  it('throws not found when deactivating a missing user', async () => {
    const service = new UsersService(
      buildRepository({ findById: vi.fn().mockResolvedValue(null) }),
      { record: vi.fn() },
    );

    await expect(service.deactivate(tenantId, userId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
