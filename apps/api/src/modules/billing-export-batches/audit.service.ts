import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';

type AuditRecordInput = {
  readonly tenantId: string;
  readonly action: string;
  readonly entityId: string;
  readonly beforeData?: unknown;
  readonly afterData?: unknown;
};

@Injectable()
export class BillingExportBatchesAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        action: input.action,
        entityType: 'billing_export_batch',
        entityId: input.entityId,
        beforeData: input.beforeData ? JSON.parse(JSON.stringify(input.beforeData)) : undefined,
        afterData: input.afterData ? JSON.parse(JSON.stringify(input.afterData)) : undefined,
      },
    });
  }
}
