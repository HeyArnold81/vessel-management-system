import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { AssignUserRoleDto, CreateUserDto } from './create-user.dto.js';

describe('User DTO validation', () => {
  it('accepts a valid user create payload', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      email: 'planner@example.com',
      displayName: 'Marine Planner',
      authProvider: 'local',
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid email addresses', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      email: 'not-an-email',
      displayName: 'Marine Planner',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a valid role assignment payload', async () => {
    const dto = Object.assign(new AssignUserRoleDto(), {
      roleId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
