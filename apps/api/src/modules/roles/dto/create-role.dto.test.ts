import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateRoleDto, UpdateRoleDto } from './create-role.dto.js';

describe('Role DTO validation', () => {
  it('accepts a valid role create payload', async () => {
    const dto = Object.assign(new CreateRoleDto(), {
      code: 'marine_planner',
      name: 'Marine Planner',
      permissionIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid role codes', async () => {
    const dto = Object.assign(new CreateRoleDto(), {
      code: 'Marine Planner',
      name: 'Marine Planner',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a valid role update payload', async () => {
    const dto = Object.assign(new UpdateRoleDto(), {
      name: 'Updated Role',
      description: 'Updated permissions.',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
