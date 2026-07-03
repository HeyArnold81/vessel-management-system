'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  BillingEventRecord,
  BillingEventStatus,
  CreateBillingEventInput,
  MovementServiceRecord,
  PaginatedResponse,
  UpdateBillingEventInput,
} from '@vms/shared';
import { billingEventStatuses } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';
import { listMovementServices } from '@/features/movement-services/api';

import {
  createBillingEvent,
  deleteBillingEvent,
  listBillingEvents,
  updateBillingEvent,
} from './api';
import { BillingEventForm } from './billing-event-form';

const initialPage: PaginatedResponse<BillingEventRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

type BillingEventsPageProps = {
  readonly initialSearch?: string;
};

export function BillingEventsPage({ initialSearch = '' }: BillingEventsPageProps) {
  const [page, setPage] = useState(initialPage);
  const [movementServices, setMovementServices] = useState<readonly MovementServiceRecord[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<BillingEventStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBillingEvent, setEditingBillingEvent] = useState<BillingEventRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  const movementServiceLabels = useMemo(
    () =>
      new Map(
        movementServices.map((movementService) => [
          movementService.id,
          `${movementService.quantity} ${movementService.unitOfMeasure} · ${movementService.status}`,
        ]),
      ),
    [movementServices],
  );

  async function loadBillingEvents(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listBillingEvents({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load billing events.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);
      setSearch(initialSearch);

      try {
        const [movementServiceResult, billingEventResult] = await Promise.all([
          listMovementServices({
            page: 1,
            pageSize: 100,
            status: 'completed',
            isBillable: true,
            sortBy: 'completedAt',
            sortDirection: 'desc',
          }),
          listBillingEvents({
            page: 1,
            pageSize: 10,
            search: initialSearch,
            sortBy: 'createdAt',
            sortDirection: 'desc',
          }),
        ]);

        setMovementServices(movementServiceResult.data);
        setPage(billingEventResult);
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load billing events.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, [initialSearch]);

  async function submitBillingEvent(input: CreateBillingEventInput | UpdateBillingEventInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBillingEvent) {
        await updateBillingEvent(editingBillingEvent.id, input as UpdateBillingEventInput);
      } else {
        await createBillingEvent(input as CreateBillingEventInput);
      }
      setEditingBillingEvent(undefined);
      await loadBillingEvents(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save billing event.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function rejectBillingEvent(billingEvent: BillingEventRecord) {
    if (
      !window.confirm(
        `Reject billing event ${billingEvent.eventReference}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteBillingEvent(billingEvent.id);
      await loadBillingEvents(currentPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to reject billing event.',
      );
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">ERP billing</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Billing Events</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Generate and review ERP-ready billing events from completed billable movement
              services.
            </p>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <BillingEventForm
            key={editingBillingEvent?.id ?? 'new-billing-event'}
            billingEvent={editingBillingEvent}
            movementServices={movementServices}
            isSubmitting={isSubmitting}
            onSubmit={submitBillingEvent}
            onCancel={editingBillingEvent ? () => setEditingBillingEvent(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
              <input
                placeholder="Search events"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BillingEventStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {billingEventStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadBillingEvents(1)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">ERP</th>
                    <th className="py-3 pr-4">Exported</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((billingEvent) => (
                    <tr key={billingEvent.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {billingEvent.eventReference}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {movementServiceLabels.get(billingEvent.movementServiceId) ??
                          billingEvent.movementServiceId}
                      </td>
                      <td className="py-3 pr-4 text-steel">{billingEvent.status}</td>
                      <td className="py-3 pr-4 text-steel">{billingEvent.erpSystem ?? '-'}</td>
                      <td className="py-3 pr-4 text-steel">
                        {formatDateTime(billingEvent.exportedAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingBillingEvent(billingEvent)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void rejectBillingEvent(billingEvent)}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No billing events match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading billing events...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} billing
                events
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadBillingEvents(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadBillingEvents(currentPage + 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
