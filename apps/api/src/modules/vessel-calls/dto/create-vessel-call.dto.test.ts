import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateVesselCallDto } from './create-vessel-call.dto.js';

describe('CreateVesselCallDto', () => {
  it('accepts a valid vessel call payload', async () => {
    const dto = plainToInstance(CreateVesselCallDto, {
      callReference: 'CALL-2026-0001',
      vesselId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      portId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      status: 'expected',
      eta: '2026-07-01T10:00:00.000Z',
      etd: '2026-07-02T18:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid references and statuses', async () => {
    const dto = plainToInstance(CreateVesselCallDto, {
      callReference: 'bad reference',
      vesselId: 'not-a-uuid',
      portId: 'not-a-uuid',
      status: 'unknown',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['callReference', 'vesselId', 'portId', 'status']),
    );
  });
});
