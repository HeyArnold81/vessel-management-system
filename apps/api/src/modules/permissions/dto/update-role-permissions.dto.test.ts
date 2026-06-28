import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpdateRolePermissionsDto } from './update-role-permissions.dto.js';

describe('UpdateRolePermissionsDto', () => {
  it('accepts valid permission ids', async () => {
    const dto = plainToInstance(UpdateRolePermissionsDto, {
      permissionIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid permission ids', async () => {
    const dto = plainToInstance(UpdateRolePermissionsDto, {
      permissionIds: ['not-a-uuid'],
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
