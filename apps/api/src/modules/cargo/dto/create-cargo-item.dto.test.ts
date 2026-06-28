import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateCargoItemDto } from './create-cargo-item.dto.js';

describe('CreateCargoItemDto', () => {
  it('rejects invalid cargo payloads', async () => {
    const dto = Object.assign(new CreateCargoItemDto(), {
      cargoCode: 'bad code',
      name: 'X',
      cargoCategory: 'unknown',
      unNumber: '12',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['cargoCode', 'name', 'cargoCategory', 'unNumber']),
    );
  });

  it('accepts valid cargo payloads', async () => {
    const dto = Object.assign(new CreateCargoItemDto(), {
      cargoCode: 'IRON-ORE',
      name: 'Iron Ore Fines',
      cargoCategory: 'bulk',
      isHazardous: false,
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
