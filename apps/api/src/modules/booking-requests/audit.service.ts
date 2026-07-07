import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';

type AuditInput = {
  readonly tenantId: string;
  readonly action: string;
  readonly entityId: string;
  readonly entityType?: string;
  readonly beforeData?: unknown;
  readonly afterData?: unknown;
  readonly metadata?: Record<string, unknown>;
};

@Injectable()
export class BookingRequestsAuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(input: AuditInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: input.action,
        entityType: input.entityType ?? 'booking_request',
        entityId: input.entityId,
        beforeData:
          input.beforeData === undefined ? undefined : JSON.parse(JSON.stringify(input.beforeData)),
        afterData:
          input.afterData === undefined ? undefined : JSON.parse(JSON.stringify(input.afterData)),
        metadata: {
          source: 'booking-requests-api',
          ...(input.metadata ?? {}),
        },
      },
    });
  }
}
