import type {
  CreateMovementInput,
  MovementListQuery,
  MovementRecord,
  PaginatedResponse,
  UpdateMovementInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listMovements(
  query: MovementListQuery,
): Promise<PaginatedResponse<MovementRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<MovementRecord>>(`/api/v1/movements?${params.toString()}`);
}

export function createMovement(input: CreateMovementInput): Promise<MovementRecord> {
  return requestJson<MovementRecord>('/api/v1/movements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateMovement(id: string, input: UpdateMovementInput): Promise<MovementRecord> {
  return requestJson<MovementRecord>(`/api/v1/movements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteMovement(id: string): Promise<MovementRecord> {
  return requestJson<MovementRecord>(`/api/v1/movements/${id}`, {
    method: 'DELETE',
  });
}
