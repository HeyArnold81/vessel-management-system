import type { OrganizationListQuery, OrganizationRecord, PaginatedResponse } from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listOrganizations(
  query: OrganizationListQuery,
): Promise<PaginatedResponse<OrganizationRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<OrganizationRecord>>(
    `/api/v1/organizations?${params.toString()}`,
  );
}
