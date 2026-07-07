'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { BookingRequestRecord, BookingRequestStatus, PaginatedResponse } from '@vms/shared';
import type { BookingRequestedServiceRecord, ServiceCatalogRecord } from '@vms/shared';
import { bookingRequestStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';
import { listServices } from '@/features/services/api';

import {
  approveBookingRequest,
  confirmBookingRequest,
  createBookingRequestedService,
  deleteBookingRequestedService,
  listBookingRequestedServices,
  listBookingRequests,
  markBookingRequestAvailabilityChecked,
  startBookingRequestReview,
  submitBookingRequest,
} from './api';

const initialPage: PaginatedResponse<BookingRequestRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function BookingRequestsPage() {
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<BookingRequestStatus | ''>('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequestRecord | null>(null);
  const [services, setServices] = useState<readonly ServiceCatalogRecord[]>([]);
  const [requestedServices, setRequestedServices] = useState<
    readonly BookingRequestedServiceRecord[]
  >([]);
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [serviceInput, setServiceInput] = useState({
    serviceId: '',
    quantity: '1',
    unitOfMeasure: '',
    notes: '',
  });
  const summary = useMemo(() => buildSummary(page.data), [page.data]);

  async function loadRequests(nextStatus: BookingRequestStatus | '' = status) {
    setIsLoading(true);
    setError(null);

    try {
      setPage(
        await listBookingRequests({
          page: 1,
          pageSize: 10,
          status: nextStatus || undefined,
          search,
          sortBy: 'requestedEta',
          sortDirection: 'asc',
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load booking requests.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests('');
    void loadServiceCatalog();
    // Initial load should not rerun on search edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadServiceCatalog() {
    try {
      const servicePage = await listServices({
        page: 1,
        pageSize: 100,
        status: 'active',
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setServices(servicePage.data);
    } catch {
      setServices([]);
    }
  }

  async function progressRequest(request: BookingRequestRecord) {
    setError(null);

    try {
      if (request.status === 'draft') {
        await submitBookingRequest(request.id);
      } else if (request.status === 'submitted') {
        await startBookingRequestReview(request.id);
      } else if (request.status === 'under_review') {
        await markBookingRequestAvailabilityChecked(request.id);
      } else if (request.status === 'availability_checked') {
        await approveBookingRequest(request.id);
      } else if (request.status === 'approved') {
        await confirmBookingRequest(request.id);
      }

      await loadRequests();
      if (selectedRequest?.id === request.id) {
        await selectRequest({ ...request, status: getNextStatus(request.status) });
      }
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to progress booking request.',
      );
    }
  }

  async function selectRequest(request: BookingRequestRecord) {
    setSelectedRequest(request);
    setIsServicesLoading(true);
    setError(null);

    try {
      setRequestedServices(await listBookingRequestedServices(request.id));
      const firstService = services[0];
      setServiceInput({
        serviceId: firstService?.id ?? '',
        quantity: '1',
        unitOfMeasure: firstService?.defaultUnit ?? '',
        notes: '',
      });
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load requested services.',
      );
    } finally {
      setIsServicesLoading(false);
    }
  }

  async function addRequestedService() {
    if (!selectedRequest || !serviceInput.serviceId) {
      return;
    }

    setError(null);

    try {
      await createBookingRequestedService(selectedRequest.id, {
        serviceId: serviceInput.serviceId,
        quantity: Number(serviceInput.quantity),
        unitOfMeasure: serviceInput.unitOfMeasure,
        requestedAt: selectedRequest.requestedEta,
        notes: serviceInput.notes || null,
      });
      await selectRequest(selectedRequest);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to add service request.');
    }
  }

  async function removeRequestedService(requestedService: BookingRequestedServiceRecord) {
    if (!selectedRequest) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${requestedService.serviceName} from ${selectedRequest.requestReference}?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteBookingRequestedService(selectedRequest.id, requestedService.id);
      await selectRequest(selectedRequest);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to remove service request.',
      );
    }
  }

  function updateSelectedService(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    setServiceInput({
      ...serviceInput,
      serviceId,
      unitOfMeasure: service?.defaultUnit ?? serviceInput.unitOfMeasure,
    });
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Customer intake"
          title="Booking Requests"
          description="Review customer and agent booking requests before confirming operational vessel calls."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total requests
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Pre-confirmation layer
              </span>
            </div>
          }
        />

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Booking KPIs">
          <Kpi label="Visible" value={page.data.length} detail="Current queue" />
          <Kpi label="Submitted" value={summary.submitted} detail="Awaiting review" />
          <Kpi label="Approved" value={summary.approved} detail="Ready to confirm" />
          <Kpi label="Confirmed" value={summary.confirmed} detail="Linked to vessel call" />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
              <input
                placeholder="Search booking requests"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BookingRequestStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {bookingRequestStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-sm text-steel">Loading booking requests...</p>
          ) : null}

          {!isLoading && page.data.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No booking requests match this view"
                description="Booking requests will appear here before they become confirmed vessel calls."
              />
            </div>
          ) : null}

          {page.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="px-5 py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Requested window</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Vessel call</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((request) => (
                    <tr key={request.id}>
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        {request.requestReference}
                        {request.voyageNumber ? (
                          <p className="mt-1 text-xs font-normal text-steel">
                            Voyage {request.voyageNumber}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {formatDateTime(request.requestedEta)} →{' '}
                        {formatDateTime(request.requestedEtd)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {request.vesselCallId ? (
                          <Link
                            href={`/vessel-calls?id=${request.vesselCallId}`}
                            className="font-semibold text-harbour hover:underline"
                          >
                            Open vessel call
                          </Link>
                        ) : (
                          'Not confirmed'
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void selectRequest(request)}
                            className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
                          >
                            Services
                          </button>
                          {getNextActionLabel(request) ? (
                            <button
                              type="button"
                              onClick={() => void progressRequest(request)}
                              className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
                            >
                              {getNextActionLabel(request)}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <p className="text-sm font-semibold text-ink">Requested services</p>
            <p className="mt-1 text-sm text-steel">
              {selectedRequest
                ? `Service demand for ${selectedRequest.requestReference}`
                : 'Select a booking request to review service demand before movements are planned.'}
            </p>
          </div>

          {!selectedRequest ? (
            <div className="p-5">
              <EmptyState
                title="No booking request selected"
                description="Choose Services on a booking request to attach pilotage, towage, mooring or other marine services."
              />
            </div>
          ) : null}

          {selectedRequest ? (
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_22rem]">
              <div className="overflow-x-auto">
                {isServicesLoading ? (
                  <p className="py-8 text-center text-sm text-steel">Loading requested services...</p>
                ) : null}

                {!isServicesLoading && requestedServices.length === 0 ? (
                  <EmptyState
                    title="No services requested"
                    description="Requested services can be captured here before they are assigned to operational movements."
                  />
                ) : null}

                {requestedServices.length > 0 ? (
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-surface">
                      <tr className="text-xs uppercase tracking-wide text-steel">
                        <th className="px-4 py-3">Service</th>
                        <th className="py-3">Quantity</th>
                        <th className="py-3">Status</th>
                        <th className="py-3">Billable</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestedServices.map((requestedService) => (
                        <tr key={requestedService.id}>
                          <td className="px-4 py-3 font-semibold text-ink">
                            {requestedService.serviceName}
                            <p className="mt-1 text-xs font-normal text-steel">
                              {requestedService.serviceCode} · {requestedService.serviceCategory}
                            </p>
                          </td>
                          <td className="py-3 text-steel">
                            {requestedService.quantity} {requestedService.unitOfMeasure}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={requestedService.status} />
                          </td>
                          <td className="py-3 text-steel">
                            {requestedService.isBillable ? 'Yes' : 'No'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canEditRequestedServices(selectedRequest) ? (
                              <button
                                type="button"
                                onClick={() => void removeRequestedService(requestedService)}
                                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                              >
                                Remove
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>

              <div className="rounded-md border border-line bg-surface p-4">
                <p className="text-sm font-semibold text-ink">Add service request</p>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-sm text-steel">
                    Service
                    <select
                      value={serviceInput.serviceId}
                      onChange={(event) => updateSelectedService(event.target.value)}
                      disabled={!canEditRequestedServices(selectedRequest)}
                      className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
                    >
                      <option value="">Select service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-sm text-steel">
                      Quantity
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={serviceInput.quantity}
                        onChange={(event) =>
                          setServiceInput({ ...serviceInput, quantity: event.target.value })
                        }
                        disabled={!canEditRequestedServices(selectedRequest)}
                        className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
                      />
                    </label>
                    <label className="grid gap-1 text-sm text-steel">
                      Unit
                      <input
                        value={serviceInput.unitOfMeasure}
                        onChange={(event) =>
                          setServiceInput({ ...serviceInput, unitOfMeasure: event.target.value })
                        }
                        disabled={!canEditRequestedServices(selectedRequest)}
                        className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
                      />
                    </label>
                  </div>
                  <label className="grid gap-1 text-sm text-steel">
                    Notes
                    <textarea
                      value={serviceInput.notes}
                      onChange={(event) =>
                        setServiceInput({ ...serviceInput, notes: event.target.value })
                      }
                      disabled={!canEditRequestedServices(selectedRequest)}
                      className="min-h-24 rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void addRequestedService()}
                    disabled={!canEditRequestedServices(selectedRequest)}
                    className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add service
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function getNextActionLabel(request: BookingRequestRecord): string {
  const labels: Record<BookingRequestStatus, string> = {
    draft: 'Submit',
    submitted: 'Start review',
    under_review: 'Mark checked',
    availability_checked: 'Approve',
    approved: 'Confirm vessel call',
    confirmed: '',
    rejected: '',
    cancelled: '',
  };

  return labels[request.status];
}

function getNextStatus(status: BookingRequestStatus): BookingRequestStatus {
  const nextStatuses: Record<BookingRequestStatus, BookingRequestStatus> = {
    draft: 'submitted',
    submitted: 'under_review',
    under_review: 'availability_checked',
    availability_checked: 'approved',
    approved: 'confirmed',
    confirmed: 'confirmed',
    rejected: 'rejected',
    cancelled: 'cancelled',
  };

  return nextStatuses[status];
}

function canEditRequestedServices(request: BookingRequestRecord): boolean {
  return ['draft', 'submitted', 'under_review', 'availability_checked'].includes(request.status);
}

function Kpi({ label, value, detail }: Readonly<{ label: string; value: number; detail: string }>) {
  return (
    <article className="rounded-md border border-line bg-panel p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-steel">{detail}</p>
    </article>
  );
}

function buildSummary(items: readonly BookingRequestRecord[]) {
  return {
    submitted: items.filter((item) => item.status === 'submitted').length,
    approved: items.filter((item) => item.status === 'approved').length,
    confirmed: items.filter((item) => item.status === 'confirmed').length,
  };
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
