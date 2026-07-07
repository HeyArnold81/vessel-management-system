import type {
  BookingRequestListQuery,
  BookingRequestedServiceRecord,
  BookingRequestRecord,
  CreateBookingRequestedServiceInput,
  CreateBookingRequestInput,
  PaginatedResponse,
  UpdateBookingRequestInput,
  VesselCallRecord,
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

export function startBookingRequestReview(id: string): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>(`/api/v1/booking-requests/${id}/start-review`, {
    method: 'POST',
  });
}

export function markBookingRequestAvailabilityChecked(id: string): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>(
    `/api/v1/booking-requests/${id}/mark-availability-checked`,
    {
      method: 'POST',
    },
  );
}

export function approveBookingRequest(id: string): Promise<BookingRequestRecord> {
  return requestJson<BookingRequestRecord>(`/api/v1/booking-requests/${id}/approve`, {
    method: 'POST',
  });
}

export function confirmBookingRequest(
  id: string,
): Promise<{ bookingRequest: BookingRequestRecord; vesselCall: VesselCallRecord }> {
  return requestJson<{ bookingRequest: BookingRequestRecord; vesselCall: VesselCallRecord }>(
    `/api/v1/booking-requests/${id}/confirm`,
    {
      method: 'POST',
    },
  );
}

export function listBookingRequestedServices(
  bookingRequestId: string,
): Promise<readonly BookingRequestedServiceRecord[]> {
  return requestJson<readonly BookingRequestedServiceRecord[]>(
    `/api/v1/booking-requests/${bookingRequestId}/requested-services`,
  );
}

export function createBookingRequestedService(
  bookingRequestId: string,
  input: CreateBookingRequestedServiceInput,
): Promise<BookingRequestedServiceRecord> {
  return requestJson<BookingRequestedServiceRecord>(
    `/api/v1/booking-requests/${bookingRequestId}/requested-services`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function deleteBookingRequestedService(
  bookingRequestId: string,
  requestedServiceId: string,
): Promise<BookingRequestedServiceRecord> {
  return requestJson<BookingRequestedServiceRecord>(
    `/api/v1/booking-requests/${bookingRequestId}/requested-services/${requestedServiceId}`,
    {
      method: 'DELETE',
    },
  );
}
