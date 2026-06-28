import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import {
  CreateBillingExportBatchDto,
  UpdateBillingExportBatchDto,
} from './create-billing-export-batch.dto.js';

describe('BillingExportBatch DTO validation', () => {
  it('accepts a valid create payload', async () => {
    const dto = Object.assign(new CreateBillingExportBatchDto(), {
      erpSystem: 'SAP',
      billingEventIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
      batchReference: 'ERP-EXPORT-2026-0001',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects empty billing event ids', async () => {
    const dto = Object.assign(new CreateBillingExportBatchDto(), {
      erpSystem: 'SAP',
      billingEventIds: [],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('accepts a valid update payload', async () => {
    const dto = Object.assign(new UpdateBillingExportBatchDto(), {
      status: 'exported',
      externalReference: 'SAP-DOC-90000123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
