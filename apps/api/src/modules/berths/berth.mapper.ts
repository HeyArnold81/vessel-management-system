import type { Berth } from '@prisma/client';

import type { BerthRecord, BerthStatus } from '@vms/shared';

export function toBerthRecord(berth: Berth): BerthRecord {
  return {
    id: berth.id,
    tenantId: berth.tenantId,
    terminalId: berth.terminalId,
    code: berth.code,
    name: berth.name,
    maxLengthM: berth.maxLengthM?.toString() ?? null,
    maxDraftM: berth.maxDraftM?.toString() ?? null,
    status: berth.status as BerthStatus,
    createdAt: berth.createdAt.toISOString(),
    updatedAt: berth.updatedAt.toISOString(),
  };
}
