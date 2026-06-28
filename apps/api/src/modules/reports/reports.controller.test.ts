import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { ReportsController } from './reports.controller.js';

const tenantId = '11111111-1111-4111-8111-111111111111';

function buildService() {
  return {
    getOverview: vi.fn().mockResolvedValue({ generatedAt: '2026-06-01T00:00:00.000Z' }),
  };
}

describe('ReportsController', () => {
  it('passes tenant and query to the service', async () => {
    const service = buildService();
    const controller = new ReportsController(service as never);
    const query = { from: '2026-06-01T00:00:00.000Z' };

    await controller.getOverview(tenantId, query);

    expect(service.getOverview).toHaveBeenCalledWith(tenantId, query);
  });

  it('requires the tenant header', () => {
    const controller = new ReportsController(buildService() as never);

    expect(() => controller.getOverview(undefined, {})).toThrow(BadRequestException);
  });
});
