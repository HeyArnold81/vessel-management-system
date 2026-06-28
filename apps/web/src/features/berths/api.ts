import type {
  BerthListQuery,
  BerthRecord,
  CreateBerthInput,
  PaginatedResponse,
  UpdateBerthInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listBerths(query: BerthListQuery): Promise<PaginatedResponse<BerthRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<BerthRecord>>(`/api/v1/berths?${params.toString()}`);
}

export function createBerth(input: CreateBerthInput): Promise<BerthRecord> {
  return requestJson<BerthRecord>('/api/v1/berths', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBerth(id: string, input: UpdateBerthInput): Promise<BerthRecord> {
  return requestJson<BerthRecord>(`/api/v1/berths/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBerth(id: string): Promise<BerthRecord> {
  return requestJson<BerthRecord>(`/api/v1/berths/${id}`, {
    method: 'DELETE',
  });
}
