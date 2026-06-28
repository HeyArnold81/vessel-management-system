import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { ReportsRepository } from './reports.repository.js';
import { ReportsService } from './reports.service.js';

const tenantId = '11111111-1111-4111-8111-111111111111';

function buildRepository(overrides: Partial<ReportsRepository> = {}): ReportsRepository {
  return {
    getOverviewData: vi.fn().mockResolvedValue({
      vesselCallCount: 4,
      movementCount: 3,
      movementServiceCount: 2,
      billingEventCount: 2,
      failedBillingEventCount: 1,
      readyBillingEventCount: 1,
      exportBatchCount: 1,
      vesselCallsByStatus: [{ key: 'planned', count: 2 }],
      movementsByStatus: [{ key: 'in_progress', count: 1 }],
      movementsByType: [{ key: 'arrival', count: 1 }],
      berthActivity: [{ key: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', count: 2 }],
      billingEventsByStatus: [{ key: 'ready', count: 1 }],
      billableServicesByStatus: [{ key: 'completed', count: 1 }],
      exportBatchesByStatus: [{ key: 'exported', count: 1 }],
      upcomingArrivals: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          reference: 'VC-001',
          status: 'planned',
          occurredAt: new Date('2026-06-10T10:00:00.000Z'),
          portId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          berthId: null,
        },
      ],
      upcomingDepartures: [],
      pendingBillingEvents: [],
      failedBillingEvents: [],
    }),
    ...overrides,
  };
}

describe('ReportsService', () => {
  it('returns an overview report with labelled metrics', async () => {
    const service = new ReportsService(buildRepository());

    await expect(
      service.getOverview(tenantId, {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.999Z',
      }),
    ).resolves.toMatchObject({
      filters: {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.999Z',
      },
      operations: {
        metrics: expect.arrayContaining([{ key: 'vessel_calls', label: 'Vessel calls', value: 4 }]),
        movementsByStatus: [{ key: 'in_progress', label: 'In progress', count: 1 }],
        upcomingArrivals: [{ reference: 'VC-001', occurredAt: '2026-06-10T10:00:00.000Z' }],
      },
      billing: {
        metrics: expect.arrayContaining([
          { key: 'billing_events', label: 'Billing events', value: 2 },
        ]),
      },
    });
  });

  it('rejects an invalid date range', async () => {
    const service = new ReportsService(buildRepository());

    await expect(
      service.getOverview(tenantId, {
        from: '2026-07-01T00:00:00.000Z',
        to: '2026-06-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
