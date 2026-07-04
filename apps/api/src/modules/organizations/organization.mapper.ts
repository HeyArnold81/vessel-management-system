import type { Organization } from '@prisma/client';

import type { OrganizationRecord } from '@vms/shared';

export function toOrganizationRecord(organization: Organization): OrganizationRecord {
  return {
    id: organization.id,
    tenantId: organization.tenantId,
    legalName: organization.legalName,
    tradingName: organization.tradingName,
    registrationNumber: organization.registrationNumber,
    taxNumber: organization.taxNumber,
    email: organization.email,
    phone: organization.phone,
    status: organization.status,
    createdAt: organization.createdAt.toISOString(),
    updatedAt: organization.updatedAt.toISOString(),
  };
}
