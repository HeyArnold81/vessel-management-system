import type { BillingEvent } from '@prisma/client';

import type { BillingEventPayload, BillingEventRecord, BillingEventStatus } from '@vms/shared';

export function toBillingEventRecord(event: BillingEvent): BillingEventRecord {
  return {
    id: event.id,
    tenantId: event.tenantId,
    eventReference: event.eventReference,
    movementServiceId: event.movementServiceId,
    status: event.status as BillingEventStatus,
    erpSystem: event.erpSystem,
    exportBatchId: event.exportBatchId,
    exportedAt: event.exportedAt?.toISOString() ?? null,
    acceptedAt: event.acceptedAt?.toISOString() ?? null,
    rejectedAt: event.rejectedAt?.toISOString() ?? null,
    failureReason: event.failureReason,
    payload: event.payload as BillingEventPayload,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
