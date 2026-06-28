import type { BillingExportBatch } from '@prisma/client';

import type {
  BillingExportBatchPayload,
  BillingExportBatchRecord,
  BillingExportBatchStatus,
} from '@vms/shared';

export function toBillingExportBatchRecord(batch: BillingExportBatch): BillingExportBatchRecord {
  return {
    id: batch.id,
    tenantId: batch.tenantId,
    batchReference: batch.batchReference,
    status: batch.status as BillingExportBatchStatus,
    erpSystem: batch.erpSystem,
    externalReference: batch.externalReference,
    eventCount: batch.eventCount,
    payload: batch.payload as unknown as BillingExportBatchPayload,
    requestedAt: batch.requestedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() ?? null,
    failedAt: batch.failedAt?.toISOString() ?? null,
    failureReason: batch.failureReason,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}
