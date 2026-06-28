import type {
  CreateMovementServiceInput,
  MovementServiceListQuery,
  MovementServiceRecord,
  PaginatedResponse,
  UpdateMovementServiceInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listMovementServices(
  query: MovementServiceListQuery,
): Promise<PaginatedResponse<MovementServiceRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<MovementServiceRecord>>(
    `/api/v1/movement-services?${params.toString()}`,
  );
}

export function createMovementService(
  input: CreateMovementServiceInput,
): Promise<MovementServiceRecord> {
  return requestJson<MovementServiceRecord>('/api/v1/movement-services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMovementService(
  id: string,
  input: UpdateMovementServiceInput,
): Promise<MovementServiceRecord> {
  return requestJson<MovementServiceRecord>(`/api/v1/movement-services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteMovementService(id: string): Promise<MovementServiceRecord> {
  return requestJson<MovementServiceRecord>(`/api/v1/movement-services/${id}`, {
    method: 'DELETE',
  });
}
