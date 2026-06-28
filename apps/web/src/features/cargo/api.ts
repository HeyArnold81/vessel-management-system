import type {
  CargoItemListQuery,
  CargoItemRecord,
  CreateCargoItemInput,
  PaginatedResponse,
  UpdateCargoItemInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listCargoItems(
  query: CargoItemListQuery,
): Promise<PaginatedResponse<CargoItemRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<CargoItemRecord>>(
    `/api/v1/cargo-items?${params.toString()}`,
  );
}

export function createCargoItem(input: CreateCargoItemInput): Promise<CargoItemRecord> {
  return requestJson<CargoItemRecord>('/api/v1/cargo-items', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCargoItem(id: string, input: UpdateCargoItemInput): Promise<CargoItemRecord> {
  return requestJson<CargoItemRecord>(`/api/v1/cargo-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCargoItem(id: string): Promise<CargoItemRecord> {
  return requestJson<CargoItemRecord>(`/api/v1/cargo-items/${id}`, {
    method: 'DELETE',
  });
}
