import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateServiceCatalogDto } from './create-service-catalog.dto.js';

describe('CreateServiceCatalogDto', () => {
  it('accepts a valid service catalog payload', async () => {
    const dto = plainToInstance(CreateServiceCatalogDto, {
      code: 'PILOTAGE',
      name: 'Harbour Pilotage',
      category: 'pilotage',
      defaultUnit: 'job',
      isBillable: true,
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid codes and categories', async () => {
    const dto = plainToInstance(CreateServiceCatalogDto, {
      code: 'bad code',
      name: 'X',
      category: 'unknown',
      defaultUnit: '',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['code', 'name', 'category', 'defaultUnit']),
    );
  });
});
