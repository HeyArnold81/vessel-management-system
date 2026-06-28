import { BadRequestException } from '@nestjs/common';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireTenantId(value: string | undefined): string {
  if (!value || !uuidPattern.test(value)) {
    throw new BadRequestException('A valid x-tenant-id header is required.');
  }

  return value;
}
