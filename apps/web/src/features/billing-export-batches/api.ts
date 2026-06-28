import type {
  BillingExportBatchListQuery,
  BillingExportBatchRecord,
  CreateBillingExportBatchInput,
  PaginatedResponse,
  UpdateBillingExportBatchInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listBillingExportBatches(
  query: BillingExportBatchListQuery,
): Promise<PaginatedResponse<BillingExportBatchRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<BillingExportBatchRecord>>(
    `/api/v1/billing-export-batches?${params.toString()}`,
  );
}

export function createBillingExportBatch(
  input: CreateBillingExportBatchInput,
): Promise<BillingExportBatchRecord> {
  return requestJson<BillingExportBatchRecord>('/api/v1/billing-export-batches', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBillingExportBatch(
  id: string,
  input: UpdateBillingExportBatchInput,
): Promise<BillingExportBatchRecord> {
  return requestJson<BillingExportBatchRecord>(`/api/v1/billing-export-batches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteBillingExportBatch(id: string): Promise<BillingExportBatchRecord> {
  return requestJson<BillingExportBatchRecord>(`/api/v1/billing-export-batches/${id}`, {
    method: 'DELETE',
  });
}
