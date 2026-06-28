import type {
  CreatePortInput,
  PaginatedResponse,
  PortListQuery,
  PortRecord,
  UpdatePortInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listPorts(query: PortListQuery): Promise<PaginatedResponse<PortRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<PortRecord>>(`/api/v1/ports?${params.toString()}`);
}

export function createPort(input: CreatePortInput): Promise<PortRecord> {
  return requestJson<PortRecord>('/api/v1/ports', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePort(id: string, input: UpdatePortInput): Promise<PortRecord> {
  return requestJson<PortRecord>(`/api/v1/ports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deletePort(id: string): Promise<PortRecord> {
  return requestJson<PortRecord>(`/api/v1/ports/${id}`, {
    method: 'DELETE',
  });
}
