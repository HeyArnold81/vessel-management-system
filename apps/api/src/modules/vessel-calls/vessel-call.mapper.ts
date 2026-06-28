import type { VesselCall } from '@prisma/client';

import type { VesselCallRecord, VesselCallStatus } from '@vms/shared';

export function toVesselCallRecord(vesselCall: VesselCall): VesselCallRecord {
  return {
    id: vesselCall.id,
    tenantId: vesselCall.tenantId,
    callReference: vesselCall.callReference,
    vesselId: vesselCall.vesselId,
    portId: vesselCall.portId,
    berthId: vesselCall.berthId,
    agentId: vesselCall.agentId,
    operatorId: vesselCall.operatorId,
    voyageNumber: vesselCall.voyageNumber,
    status: vesselCall.status as VesselCallStatus,
    eta: vesselCall.eta?.toISOString() ?? null,
    etd: vesselCall.etd?.toISOString() ?? null,
    ata: vesselCall.ata?.toISOString() ?? null,
    atd: vesselCall.atd?.toISOString() ?? null,
    remarks: vesselCall.remarks,
    createdAt: vesselCall.createdAt.toISOString(),
    updatedAt: vesselCall.updatedAt.toISOString(),
  };
}
