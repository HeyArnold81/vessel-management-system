import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateBerthDto } from './create-berth.dto.js';

describe('CreateBerthDto', () => {
  it('rejects invalid berth payloads', async () => {
    const dto = Object.assign(new CreateBerthDto(), {
      terminalId: 'bad',
      code: '',
      name: 'X',
      maxLengthM: 0,
      maxDraftM: 50,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['terminalId', 'code', 'name', 'maxLengthM', 'maxDraftM']),
    );
  });

  it('accepts valid berth payloads', async () => {
    const dto = Object.assign(new CreateBerthDto(), {
      terminalId: '88888888-8888-4888-8888-888888888888',
      code: 'B14',
      name: 'Berth 14',
      maxLengthM: 320,
      maxDraftM: 14.5,
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
