import type { MovementService } from '@prisma/client';

import type { MovementServiceRecord, MovementServiceStatus } from '@vms/shared';

export function toMovementServiceRecord(service: MovementService): MovementServiceRecord {
  return {
    id: service.id,
    tenantId: service.tenantId,
    movementId: service.movementId,
    serviceId: service.serviceId,
    providerOrganizationId: service.providerOrganizationId,
    status: service.status as MovementServiceStatus,
    quantity: service.quantity.toString(),
    unitOfMeasure: service.unitOfMeasure,
    requestedAt: service.requestedAt?.toISOString() ?? null,
    completedAt: service.completedAt?.toISOString() ?? null,
    isBillable: service.isBillable,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
