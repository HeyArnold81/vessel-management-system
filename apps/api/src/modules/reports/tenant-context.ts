import { BadRequestException } from '@nestjs/common';

export function requireTenantId(value: string | undefined): string {
  if (!value) {
    throw new BadRequestException('Tenant header x-tenant-id is required.');
  }

  return value;
}
