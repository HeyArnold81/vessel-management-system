import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateBillingEventDto, UpdateBillingEventDto } from './create-billing-event.dto.js';

describe('Billing event DTOs', () => {
  it('accepts a valid billing event create payload', async () => {
    const dto = plainToInstance(CreateBillingEventDto, {
      movementServiceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      eventReference: 'BILL-2026-0001',
      erpSystem: 'SAP',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid movement service ids and references', async () => {
    const dto = plainToInstance(CreateBillingEventDto, {
      movementServiceId: 'not-a-uuid',
      eventReference: 'bad reference',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['movementServiceId', 'eventReference']),
    );
  });

  it('accepts a valid status update', async () => {
    const dto = plainToInstance(UpdateBillingEventDto, { status: 'ready' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
