import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { RolesController } from './roles.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function buildService() {
  return {
    list: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    listPermissions: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: roleId }),
    create: vi.fn().mockResolvedValue({ id: roleId }),
    update: vi.fn().mockResolvedValue({ id: roleId }),
    remove: vi.fn().mockResolvedValue({ id: roleId }),
  };
}

describe('RolesController', () => {
  it('passes tenant and query to the service when listing roles', async () => {
    const service = buildService();
    const controller = new RolesController(service as never);

    await controller.list(tenantId, { page: 1, pageSize: 10 });

    expect(service.list).toHaveBeenCalledWith(tenantId, { page: 1, pageSize: 10 });
  });

  it('creates a tenant role', async () => {
    const service = buildService();
    const controller = new RolesController(service as never);

    await controller.create(tenantId, { code: 'marine_planner', name: 'Marine Planner' });

    expect(service.create).toHaveBeenCalledWith(tenantId, {
      code: 'marine_planner',
      name: 'Marine Planner',
    });
  });

  it('requires the tenant header', () => {
    const controller = new RolesController(buildService() as never);

    expect(() => controller.getById(undefined, { id: roleId })).toThrow(BadRequestException);
  });
});
