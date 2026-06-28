import type {
  CreateVesselInput,
  PaginatedResponse,
  UpdateVesselInput,
  VesselListQuery,
  VesselRecord,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listVessels(query: VesselListQuery): Promise<PaginatedResponse<VesselRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<VesselRecord>>(`/api/v1/vessels?${params.toString()}`);
}

export function createVessel(input: CreateVesselInput): Promise<VesselRecord> {
  return requestJson<VesselRecord>('/api/v1/vessels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateVessel(id: string, input: UpdateVesselInput): Promise<VesselRecord> {
  return requestJson<VesselRecord>(`/api/v1/vessels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteVessel(id: string): Promise<VesselRecord> {
  return requestJson<VesselRecord>(`/api/v1/vessels/${id}`, {
    method: 'DELETE',
  });
}
