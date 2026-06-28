import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { UsersController } from './users.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const roleId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  return {
    list: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    getById: vi.fn().mockResolvedValue({ id: userId }),
    create: vi.fn().mockResolvedValue({ id: userId }),
    update: vi.fn().mockResolvedValue({ id: userId }),
    deactivate: vi.fn().mockResolvedValue({ id: userId, status: 'deactivated' }),
    assignRole: vi.fn().mockResolvedValue({ id: userId }),
    removeRole: vi.fn().mockResolvedValue({ id: userId }),
  };
}

describe('UsersController', () => {
  it('passes tenant and query to the service when listing users', async () => {
    const service = buildService();
    const controller = new UsersController(service as never);

    await controller.list(tenantId, { page: 1, pageSize: 10 });

    expect(service.list).toHaveBeenCalledWith(tenantId, { page: 1, pageSize: 10 });
  });

  it('assigns a role to a user', async () => {
    const service = buildService();
    const controller = new UsersController(service as never);

    await controller.assignRole(tenantId, { id: userId }, { roleId });

    expect(service.assignRole).toHaveBeenCalledWith(tenantId, userId, { roleId });
  });

  it('requires the tenant header', () => {
    const controller = new UsersController(buildService() as never);

    expect(() => controller.getById(undefined, { id: userId })).toThrow(BadRequestException);
  });
});
