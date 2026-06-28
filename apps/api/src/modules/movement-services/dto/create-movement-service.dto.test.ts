import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateMovementServiceDto } from './create-movement-service.dto.js';

describe('CreateMovementServiceDto', () => {
  it('accepts a valid movement service payload', async () => {
    const dto = plainToInstance(CreateMovementServiceDto, {
      movementId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      serviceId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      quantity: 1,
      unitOfMeasure: 'job',
      status: 'requested',
      requestedAt: '2026-07-01T10:00:00.000Z',
      isBillable: true,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid ids, quantity, and status', async () => {
    const dto = plainToInstance(CreateMovementServiceDto, {
      movementId: 'not-a-uuid',
      serviceId: 'not-a-uuid',
      quantity: 0,
      unitOfMeasure: '',
      status: 'unknown',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['movementId', 'serviceId', 'quantity', 'unitOfMeasure', 'status']),
    );
  });
});
