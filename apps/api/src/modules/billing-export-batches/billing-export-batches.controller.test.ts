import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { BillingExportBatchesController } from './billing-export-batches.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const batchId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const billingEventId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function buildService() {
  return {
    list: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    getById: vi.fn().mockResolvedValue({ id: batchId }),
    create: vi.fn().mockResolvedValue({ id: batchId }),
    update: vi.fn().mockResolvedValue({ id: batchId, status: 'exported' }),
    remove: vi.fn().mockResolvedValue({ id: batchId, status: 'cancelled' }),
  };
}

describe('BillingExportBatchesController', () => {
  it('passes tenant and query to the service when listing export batches', async () => {
    const service = buildService();
    const controller = new BillingExportBatchesController(service as never);

    await controller.list(tenantId, { page: 1, pageSize: 10 });

    expect(service.list).toHaveBeenCalledWith(tenantId, { page: 1, pageSize: 10 });
  });

  it('creates an export batch from billing event ids', async () => {
    const service = buildService();
    const controller = new BillingExportBatchesController(service as never);

    await controller.create(tenantId, { erpSystem: 'SAP', billingEventIds: [billingEventId] });

    expect(service.create).toHaveBeenCalledWith(tenantId, {
      erpSystem: 'SAP',
      billingEventIds: [billingEventId],
    });
  });

  it('requires the tenant header', async () => {
    const controller = new BillingExportBatchesController(buildService() as never);

    expect(() => controller.getById(undefined, { id: batchId })).toThrow(BadRequestException);
  });
});
