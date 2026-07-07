'use client';

import { useEffect, useMemo, useState } from 'react';

import type { BookingRequestRecord, BookingRequestStatus, PaginatedResponse } from '@vms/shared';
import { bookingRequestStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';

import { listBookingRequests, submitBookingRequest } from './api';

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
    // Initial load should not rerun on search edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitRequest(request: BookingRequestRecord) {
    setError(null);

    try {
      await submitBookingRequest(request.id);
      await loadRequests();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to submit booking request.',
      );
    }
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
                        {request.vesselCallId ? 'Confirmed' : 'Not confirmed'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {request.status === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => void submitRequest(request)}
                            className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
                          >
                            Submit
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
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
