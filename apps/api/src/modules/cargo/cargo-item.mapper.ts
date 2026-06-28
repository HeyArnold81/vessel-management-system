import type { CargoItem } from '@prisma/client';

import type { CargoCategory, CargoItemRecord, CargoItemStatus } from '@vms/shared';

export function toCargoItemRecord(cargoItem: CargoItem): CargoItemRecord {
  return {
    id: cargoItem.id,
    tenantId: cargoItem.tenantId,
    cargoCode: cargoItem.cargoCode,
    name: cargoItem.name,
    cargoCategory: cargoItem.cargoCategory as CargoCategory,
    unNumber: cargoItem.unNumber,
    isHazardous: cargoItem.isHazardous,
    status: cargoItem.status as CargoItemStatus,
    createdAt: cargoItem.createdAt.toISOString(),
    updatedAt: cargoItem.updatedAt.toISOString(),
  };
}
