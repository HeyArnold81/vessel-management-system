import type { Port } from '@prisma/client';

import type { PortRecord, PortStatus } from '@vms/shared';

export function toPortRecord(port: Port): PortRecord {
  return {
    id: port.id,
    tenantId: port.tenantId,
    countryId: port.countryId,
    unlocode: port.unlocode,
    name: port.name,
    timeZone: port.timeZone,
    status: port.status as PortStatus,
    createdAt: port.createdAt.toISOString(),
    updatedAt: port.updatedAt.toISOString(),
  };
}
