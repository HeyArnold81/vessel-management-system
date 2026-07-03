import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogListQuery, AuditLogRecord, PaginatedResponse } from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { toAuditLogRecord } from './audit.mapper.js';
import { AUDIT_LOGS_REPOSITORY, type AuditLogsRepository } from './audit.repository.js';

const defaultQuery = {
  page: 1,
  pageSize: 10,
  entityType: '',
  entityId: '',
  action: '',
  sortDirection: 'desc',
} as const;

@Injectable()
export class AuditLogsService {
  constructor(
    @Inject(AUDIT_LOGS_REPOSITORY)
    private readonly repository: AuditLogsRepository,
  ) {}

  async list(
    tenantId: string,
    query: AuditLogListQuery,
  ): Promise<PaginatedResponse<AuditLogRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      entityType: query.entityType?.trim() ?? defaultQuery.entityType,
      entityId: query.entityId?.trim() ?? defaultQuery.entityId,
      action: query.action?.trim() ?? defaultQuery.action,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.auditLogs.map(toAuditLogRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }
}
