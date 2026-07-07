import { BadRequestException } from '@nestjs/common';

export function requireTenantId(tenantId: string | undefined): string {
  if (!tenantId) {
    throw new BadRequestException('Tenant id header is required.');
  }

  return tenantId;
}
