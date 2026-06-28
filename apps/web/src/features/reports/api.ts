import type { ReportDateRangeQuery, ReportsOverviewRecord } from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function getReportsOverview(query: ReportDateRangeQuery): Promise<ReportsOverviewRecord> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<ReportsOverviewRecord>(`/api/v1/reports/overview?${params.toString()}`);
}
