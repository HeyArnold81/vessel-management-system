import type {
  CreateServiceCatalogInput,
  PaginatedResponse,
  ServiceCatalogListQuery,
  ServiceCatalogRecord,
  UpdateServiceCatalogInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listServices(
  query: ServiceCatalogListQuery,
): Promise<PaginatedResponse<ServiceCatalogRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<ServiceCatalogRecord>>(
    `/api/v1/services?${params.toString()}`,
  );
}

export function createService(input: CreateServiceCatalogInput): Promise<ServiceCatalogRecord> {
  return requestJson<ServiceCatalogRecord>('/api/v1/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateService(
  id: string,
  input: UpdateServiceCatalogInput,
): Promise<ServiceCatalogRecord> {
  return requestJson<ServiceCatalogRecord>(`/api/v1/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteService(id: string): Promise<ServiceCatalogRecord> {
  return requestJson<ServiceCatalogRecord>(`/api/v1/services/${id}`, {
    method: 'DELETE',
  });
}
