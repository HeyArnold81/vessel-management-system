import { Inject, Injectable } from '@nestjs/common';
import type { AuditLog, Prisma } from '@prisma/client';

import type { SortDirection } from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';

export type AuditLogPageResult = {
  readonly auditLogs: readonly AuditLog[];
  readonly totalItems: number;
};

export type NormalizedAuditLogListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly entityType: string;
  readonly entityId: string;
  readonly action: string;
  readonly sortDirection: SortDirection;
};

export interface AuditLogsRepository {
  findPage(tenantId: string, query: NormalizedAuditLogListQuery): Promise<AuditLogPageResult>;
}

export const AUDIT_LOGS_REPOSITORY = Symbol('AUDIT_LOGS_REPOSITORY');

@Injectable()
export class PrismaAuditLogsRepository implements AuditLogsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(
    tenantId: string,
    query: NormalizedAuditLogListQuery,
  ): Promise<AuditLogPageResult> {
    const where = this.buildWhere(tenantId, query);

    const [auditLogs, totalItems] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: query.sortDirection },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { auditLogs, totalItems };
  }

  private buildWhere(
    tenantId: string,
    query: NormalizedAuditLogListQuery,
  ): Prisma.AuditLogWhereInput {
    return {
      tenantId,
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.action ? { action: query.action } : {}),
    };
  }
}
