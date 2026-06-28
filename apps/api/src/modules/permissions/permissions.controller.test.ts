import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PermissionsController } from './permissions.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const roleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const permissionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  return {
    listPermissions: vi.fn().mockResolvedValue([]),
    listGroups: vi.fn().mockResolvedValue([]),
    getMatrix: vi.fn().mockResolvedValue({ groups: [], roles: [] }),
    updateRolePermissions: vi.fn().mockResolvedValue({ id: roleId }),
  };
}

describe('PermissionsController', () => {
  it('passes tenant id when returning the matrix', async () => {
    const service = buildService();
    const controller = new PermissionsController(service as never);

    await controller.getMatrix(tenantId);

    expect(service.getMatrix).toHaveBeenCalledWith(tenantId);
  });

  it('updates role permissions for the tenant', async () => {
    const service = buildService();
    const controller = new PermissionsController(service as never);

    await controller.updateRolePermissions(tenantId, { roleId }, { permissionIds: [permissionId] });

    expect(service.updateRolePermissions).toHaveBeenCalledWith(tenantId, roleId, {
      permissionIds: [permissionId],
    });
  });

  it('requires the tenant header', () => {
    const controller = new PermissionsController(buildService() as never);

    expect(() => controller.list(undefined)).toThrow(BadRequestException);
  });
});
