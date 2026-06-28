import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateVesselDto } from './create-vessel.dto.js';

describe('CreateVesselDto', () => {
  it('rejects invalid vessel payloads', async () => {
    const dto = Object.assign(new CreateVesselDto(), {
      name: 'X',
      imoNumber: 'bad',
      vesselType: 'Container Ship',
      mmsi: '123',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'imoNumber', 'mmsi']),
    );
  });

  it('accepts valid vessel payloads', async () => {
    const dto = Object.assign(new CreateVesselDto(), {
      name: 'MV Atlantic Meridian',
      imoNumber: '9321483',
      vesselType: 'Container Ship',
      mmsi: '235123456',
      status: 'active',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
