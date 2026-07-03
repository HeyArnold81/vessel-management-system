import type { AuditLogListQuery, AuditLogRecord, PaginatedResponse } from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listAuditLogs(
  query: AuditLogListQuery,
): Promise<PaginatedResponse<AuditLogRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<AuditLogRecord>>(`/api/v1/audit-logs?${params.toString()}`);
}
