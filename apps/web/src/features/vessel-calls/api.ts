import type {
  CreateVesselCallInput,
  PaginatedResponse,
  UpdateVesselCallInput,
  VesselCallListQuery,
  VesselCallRecord,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listVesselCalls(
  query: VesselCallListQuery,
): Promise<PaginatedResponse<VesselCallRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<VesselCallRecord>>(
    `/api/v1/vessel-calls?${params.toString()}`,
  );
}

export function createVesselCall(input: CreateVesselCallInput): Promise<VesselCallRecord> {
  return requestJson<VesselCallRecord>('/api/v1/vessel-calls', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateVesselCall(
  id: string,
  input: UpdateVesselCallInput,
): Promise<VesselCallRecord> {
  return requestJson<VesselCallRecord>(`/api/v1/vessel-calls/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteVesselCall(id: string): Promise<VesselCallRecord> {
  return requestJson<VesselCallRecord>(`/api/v1/vessel-calls/${id}`, {
    method: 'DELETE',
  });
}
