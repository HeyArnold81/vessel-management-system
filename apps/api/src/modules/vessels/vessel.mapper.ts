import type { Vessel } from '@prisma/client';

import type { VesselRecord, VesselStatus } from '@vms/shared';

export function toVesselRecord(vessel: Vessel): VesselRecord {
  return {
    id: vessel.id,
    tenantId: vessel.tenantId,
    name: vessel.name,
    imoNumber: vessel.imoNumber,
    mmsi: vessel.mmsi,
    callSign: vessel.callSign,
    vesselType: vessel.vesselType,
    grossTonnage: vessel.grossTonnage?.toString() ?? null,
    lengthOverallM: vessel.lengthOverallM?.toString() ?? null,
    maxDraftM: vessel.maxDraftM?.toString() ?? null,
    status: vessel.status as VesselStatus,
    createdAt: vessel.createdAt.toISOString(),
    updatedAt: vessel.updatedAt.toISOString(),
  };
}
