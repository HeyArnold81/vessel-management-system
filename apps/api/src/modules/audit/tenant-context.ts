import { BadRequestException } from '@nestjs/common';

export function requireTenantId(value: string | undefined): string {
  if (!value) {
    throw new BadRequestException('x-tenant-id header is required.');
  }

  return value;
}
