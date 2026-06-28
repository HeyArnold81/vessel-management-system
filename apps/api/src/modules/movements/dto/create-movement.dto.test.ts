import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateMovementDto } from './create-movement.dto.js';

describe('CreateMovementDto', () => {
  it('accepts a valid movement payload', async () => {
    const dto = plainToInstance(CreateMovementDto, {
      movementReference: 'MOVE-2026-0001',
      vesselCallId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      vesselId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      portId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      movementType: 'arrival',
      status: 'planned',
      plannedAt: '2026-07-01T10:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid movement type and references', async () => {
    const dto = plainToInstance(CreateMovementDto, {
      movementReference: 'bad reference',
      vesselCallId: 'not-a-uuid',
      vesselId: 'not-a-uuid',
      portId: 'not-a-uuid',
      movementType: 'unknown',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'movementReference',
        'vesselCallId',
        'vesselId',
        'portId',
        'movementType',
      ]),
    );
  });
});
