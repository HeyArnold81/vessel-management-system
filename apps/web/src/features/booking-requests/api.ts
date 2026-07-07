import type {
  BookingRequestListQuery,
  BookingRequestRecord,
  CreateBookingRequestInput,
  PaginatedResponse,
  UpdateBookingRequestInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listBookingRequests(
  query: BookingRequestListQuery,
): Promise<PaginatedResponse<BookingRequestRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<BookingRequestRecord>>(
    `/api/v1/booking-requests?${params.toString()}`,
  );
}

export function createBookingRequest(
  input: CreateBookingRequestInput,
): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>('/api/v1/booking-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBookingRequest(
  id: string,
  input: UpdateBookingRequestInput,
): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>(`/api/v1/booking-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function submitBookingRequest(id: string): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>(`/api/v1/booking-requests/${id}/submit`, {
    method: 'POST',
  });
}
