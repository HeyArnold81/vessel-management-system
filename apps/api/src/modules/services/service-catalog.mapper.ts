import type { ServiceCatalog } from '@prisma/client';

import type { ServiceCatalogRecord, ServiceCatalogStatus, ServiceCategory } from '@vms/shared';

export function toServiceCatalogRecord(service: ServiceCatalog): ServiceCatalogRecord {
  return {
    id: service.id,
    tenantId: service.tenantId,
    code: service.code,
    name: service.name,
    category: service.category as ServiceCategory,
    defaultUnit: service.defaultUnit,
    isBillable: service.isBillable,
    status: service.status as ServiceCatalogStatus,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
