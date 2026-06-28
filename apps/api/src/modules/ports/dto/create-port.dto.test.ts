import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreatePortDto } from './create-port.dto.js';

describe('CreatePortDto', () => {
  it('rejects invalid port payloads', async () => {
    const dto = Object.assign(new CreatePortDto(), {
      countryId: 'bad',
      unlocode: 'abc',
      name: 'X',
      timeZone: '',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['countryId', 'unlocode', 'name', 'timeZone']),
    );
  });

  it('accepts valid port payloads', async () => {
    const dto = Object.assign(new CreatePortDto(), {
      countryId: '55555555-5555-4555-8555-555555555555',
      unlocode: 'GBLGP',
      name: 'London Gateway Port',
      timeZone: 'Europe/London',
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
