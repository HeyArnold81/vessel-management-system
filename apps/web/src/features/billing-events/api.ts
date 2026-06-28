import type {
  BillingEventListQuery,
  BillingEventRecord,
  CreateBillingEventInput,
  PaginatedResponse,
  UpdateBillingEventInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listBillingEvents(
  query: BillingEventListQuery,
): Promise<PaginatedResponse<BillingEventRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<BillingEventRecord>>(
    `/api/v1/billing-events?${params.toString()}`,
  );
}

export function createBillingEvent(input: CreateBillingEventInput): Promise<BillingEventRecord> {
  return requestJson<BillingEventRecord>('/api/v1/billing-events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBillingEvent(
  id: string,
  input: UpdateBillingEventInput,
): Promise<BillingEventRecord> {
  return requestJson<BillingEventRecord>(`/api/v1/billing-events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBillingEvent(id: string): Promise<BillingEventRecord> {
  return requestJson<BillingEventRecord>(`/api/v1/billing-events/${id}`, {
    method: 'DELETE',
  });
}
