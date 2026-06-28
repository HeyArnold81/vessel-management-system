import type { VesselMovement } from '@prisma/client';

import type { MovementRecord, MovementStatus, MovementType } from '@vms/shared';

export function toMovementRecord(movement: VesselMovement): MovementRecord {
  return {
    id: movement.id,
    tenantId: movement.tenantId,
    movementReference: movement.movementReference,
    vesselCallId: movement.vesselCallId,
    vesselId: movement.vesselId,
    portId: movement.portId,
    fromBerthId: movement.fromBerthId,
    toBerthId: movement.toBerthId,
    movementType: movement.movementType as MovementType,
    status: movement.status as MovementStatus,
    plannedAt: movement.plannedAt?.toISOString() ?? null,
    actualAt: movement.actualAt?.toISOString() ?? null,
    remarks: movement.remarks,
    createdAt: movement.createdAt.toISOString(),
    updatedAt: movement.updatedAt.toISOString(),
  };
}
