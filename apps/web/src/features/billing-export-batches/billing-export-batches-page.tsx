'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  BillingEventRecord,
  BillingExportBatchRecord,
  BillingExportBatchStatus,
  PaginatedResponse,
} from '@vms/shared';
import { billingExportBatchStatuses } from '@vms/shared';

import { listBillingEvents } from '@/features/billing-events/api';
import { ApiClientError } from '@/lib/api/http';

import {
  createBillingExportBatch,
  deleteBillingExportBatch,
  listBillingExportBatches,
  updateBillingExportBatch,
} from './api';

const initialPage: PaginatedResponse<BillingExportBatchRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function BillingExportBatchesPage() {
  const [page, setPage] = useState(initialPage);
  const [readyEvents, setReadyEvents] = useState<readonly BillingEventRecord[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<readonly string[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BillingExportBatchStatus | ''>('');
  const [erpSystem, setErpSystem] = useState('SAP');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = selectedEventIds.length;
  const selectedReference = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);

  async function loadExportBatches(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listBillingExportBatches({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        erpSystem: erpSystem || undefined,
        sortBy: 'requestedAt',
        sortDirection: 'desc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load export batches.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInitialData() {
    setIsLoading(true);
    setError(null);

    try {
      const [eventResult, batchResult] = await Promise.all([
        listBillingEvents({
          page: 1,
          pageSize: 100,
          status: 'ready',
          sortBy: 'createdAt',
          sortDirection: 'desc',
        }),
        listBillingExportBatches({
          page: 1,
          pageSize: 10,
          sortBy: 'requestedAt',
          sortDirection: 'desc',
        }),
      ]);

      setReadyEvents(eventResult.data.filter((event) => !event.exportBatchId));
      setPage(batchResult);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load export batches.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function submitExportBatch() {
    setIsSubmitting(true);
    setError(null);

    try {
      await createBillingExportBatch({ erpSystem, billingEventIds: selectedEventIds });
      setSelectedEventIds([]);
      await loadInitialData();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to create export batch.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(
    batch: BillingExportBatchRecord,
    nextStatus: BillingExportBatchStatus,
  ) {
    setError(null);

    try {
      await updateBillingExportBatch(batch.id, { status: nextStatus });
      await loadExportBatches(currentPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to update export batch.',
      );
    }
  }

  async function cancelBatch(batch: BillingExportBatchRecord) {
    if (
      !window.confirm(`Cancel export batch ${batch.batchReference}? This action cannot be undone.`)
    ) {
      return;
    }

    setError(null);

    try {
      await deleteBillingExportBatch(batch.id);
      await loadInitialData();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to cancel export batch.',
      );
    }
  }

  function toggleEvent(eventId: string) {
    setSelectedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((selectedId) => selectedId !== eventId)
        : [...current, eventId],
    );
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">ERP exports</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Billing Export Batches</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Group ready billing events into controlled outbound batches for ERP integration.
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
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-medium text-ink">
                <span>ERP system</span>
                <input
                  value={erpSystem}
                  onChange={(event) => setErpSystem(event.target.value.toUpperCase())}
                  className="rounded-md border border-slate-300 px-3 py-2 uppercase"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-ink">Ready billing events</span>
                <div className="max-h-80 overflow-auto rounded-md border border-slate-200">
                  {readyEvents.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReference.has(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="mt-1"
                      />
                      <span className="grid gap-1 text-sm">
                        <span className="font-semibold text-ink">{event.eventReference}</span>
                        <span className="text-steel">
                          {event.erpSystem ?? erpSystem} · {event.status}
                        </span>
                      </span>
                    </label>
                  ))}
                  {readyEvents.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-steel">
                      No ready billing events are available for export.
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => void submitExportBatch()}
                disabled={isSubmitting || selectedCount === 0}
                className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating...' : `Create batch (${selectedCount})`}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
              <input
                placeholder="Search batches"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BillingExportBatchStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {billingExportBatchStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadExportBatches(1)}
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
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">ERP</th>
                    <th className="py-3 pr-4">Events</th>
                    <th className="py-3 pr-4">Completed</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((batch) => (
                    <tr key={batch.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{batch.batchReference}</td>
                      <td className="py-3 pr-4 text-steel">{batch.status}</td>
                      <td className="py-3 pr-4 text-steel">{batch.erpSystem}</td>
                      <td className="py-3 pr-4 text-steel">{batch.eventCount}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(batch.completedAt)}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => void updateStatus(batch, 'exported')}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Mark exported
                          </button>
                          <button
                            onClick={() => void cancelBatch(batch)}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No billing export batches match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading export batches...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} export
                batches
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadExportBatches(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadExportBatches(currentPage + 1)}
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
