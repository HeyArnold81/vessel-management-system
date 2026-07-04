'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type {
  BillingEventRecord,
  BillingEventStatus,
  CreateBillingEventInput,
  MovementServiceRecord,
  PaginatedResponse,
  UpdateBillingEventInput,
} from '@vms/shared';
import { billingEventStatuses } from '@vms/shared';

import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { listMovementServices } from '@/features/movement-services/api';
import { ApiClientError } from '@/lib/api/http';

import {
  createBillingEvent,
  deleteBillingEvent,
  getBillingEvent,
  listBillingEvents,
  updateBillingEvent,
} from './api';
import { BillingEventForm } from './billing-event-form';

const initialPage: PaginatedResponse<BillingEventRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

type BillingEventsPageProps = {
  readonly initialId?: string;
  readonly initialSearch?: string;
};

export function BillingEventsPage({ initialId = '', initialSearch = '' }: BillingEventsPageProps) {
  const [page, setPage] = useState(initialPage);
  const [movementServices, setMovementServices] = useState<readonly MovementServiceRecord[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<BillingEventStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
  const currentPageSummary = useMemo(() => buildBillingSummary(page.data), [page.data]);

  async function loadBillingEvents(
    nextPage = currentPage,
    nextStatus: BillingEventStatus | '' = status,
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listBillingEvents({
        page: nextPage,
        pageSize: 10,
        search,
        status: nextStatus || undefined,
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
          initialId
            ? getBillingEvent(initialId)
            : listBillingEvents({
                page: 1,
                pageSize: 10,
                search: initialSearch,
                sortBy: 'createdAt',
                sortDirection: 'desc',
              }),
        ]);
        const nextPage =
          'meta' in billingEventResult
            ? billingEventResult
            : {
                data: [billingEventResult],
                meta: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
              };

        setMovementServices(movementServiceResult.data);
        setPage(nextPage);
        if (!('meta' in billingEventResult)) {
          setEditingBillingEvent(billingEventResult);
          setIsEditorOpen(true);
        }
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load billing events.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, [initialId, initialSearch]);

  async function submitBillingEvent(input: CreateBillingEventInput | UpdateBillingEventInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBillingEvent) {
        await updateBillingEvent(editingBillingEvent.id, input as UpdateBillingEventInput);
      } else {
        await createBillingEvent(input as CreateBillingEventInput);
      }
      setIsEditorOpen(false);
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

  function openCreatePanel() {
    setEditingBillingEvent(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(billingEvent: BillingEventRecord) {
    setEditingBillingEvent(billingEvent);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingBillingEvent(undefined);
  }

  function handleBillingEventRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    billingEvent: BillingEventRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(billingEvent);
    }
  }

  function applySavedView(nextStatus: BillingEventStatus | '') {
    setStatus(nextStatus);
    void loadBillingEvents(1, nextStatus);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="ERP billing"
          title="Billing Events"
          description="Generate and review ERP-ready billing events from completed billable movement services."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total billing events
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Sorted by created time
              </span>
            </div>
          }
          actions={
            <button
              type="button"
              onClick={openCreatePanel}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-panel"
            >
              New billing event
            </button>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Billing KPIs">
          <KpiCard label="Visible events" value={String(page.data.length)} detail="Current board" />
          <KpiCard
            label="Ready"
            value={String(currentPageSummary.ready)}
            detail="Prepared for ERP"
          />
          <KpiCard
            label="On hold"
            value={String(currentPageSummary.onHold)}
            detail="Needs review"
          />
          <KpiCard
            label="Exported"
            value={String(currentPageSummary.exported)}
            detail="Sent to ERP"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Billing board</h2>
                <p className="mt-1 text-sm text-steel">
                  Review ERP-ready events, hold exceptions, and track export readiness.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All events', status: '' as BillingEventStatus | '' },
                  { label: 'Ready', status: 'ready' as BillingEventStatus },
                  { label: 'On hold', status: 'on_hold' as BillingEventStatus },
                  { label: 'Exported', status: 'exported' as BillingEventStatus },
                ].map((view) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => applySavedView(view.status)}
                    className={
                      status === view.status
                        ? 'rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-steel'
                    }
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_auto]">
              <input
                placeholder="Search events"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BillingEventStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
          </div>

          <div className="overflow-x-auto">
            {page.data.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="px-5 py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">ERP</th>
                    <th className="py-3 pr-4">Exported</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((billingEvent) => (
                    <tr
                      key={billingEvent.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(billingEvent)}
                      onKeyDown={(event) => handleBillingEventRowKeyDown(event, billingEvent)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        <span>{billingEvent.eventReference}</span>
                        {billingEvent.failureReason ? (
                          <p className="mt-1 text-xs font-normal text-red-700">
                            {billingEvent.failureReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        <p className="font-medium text-ink">
                          {movementServiceLabels.get(billingEvent.movementServiceId) ??
                            'Movement service'}
                        </p>
                        <p className="mt-1 text-xs text-steel">
                          {buildBillingEvidenceLabel(billingEvent)}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={billingEvent.status} />
                      </td>
                      <td className="py-3 pr-4 text-steel">{billingEvent.erpSystem ?? '-'}</td>
                      <td className="py-3 pr-4 text-steel">
                        {formatDateTime(billingEvent.exportedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ActionMenu>
                          <ActionMenuItem onClick={() => openEditPanel(billingEvent)}>
                            Review event
                          </ActionMenuItem>
                          <ActionMenuItem
                            destructive
                            onClick={() => void rejectBillingEvent(billingEvent)}
                          >
                            Reject event
                          </ActionMenuItem>
                        </ActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {!isLoading && page.data.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No billing events match this view"
                  description="Adjust the filters or create a billing event from a completed billable movement service."
                  action={
                    <button
                      type="button"
                      onClick={openCreatePanel}
                      className="rounded-md bg-harbor px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      New billing event
                    </button>
                  }
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading billing events...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} billing
              events
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadBillingEvents(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadBillingEvents(currentPage + 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      <SlideOver
        isOpen={isEditorOpen}
        title={editingBillingEvent ? 'Edit billing event' : 'New billing event'}
        description="Review ERP-ready billing event data before export or exception handling."
        onClose={closeEditor}
      >
        <BillingEventForm
          key={editingBillingEvent?.id ?? 'new-billing-event'}
          billingEvent={editingBillingEvent}
          movementServices={movementServices}
          isSubmitting={isSubmitting}
          onSubmit={submitBillingEvent}
          onCancel={closeEditor}
        />
      </SlideOver>
    </main>
  );
}

function KpiCard({
  label,
  value,
  detail,
}: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-steel">{detail}</p>
    </div>
  );
}

function buildBillingSummary(items: readonly BillingEventRecord[]) {
  return {
    ready: items.filter((item) => item.status === 'ready').length,
    onHold: items.filter((item) => item.status === 'on_hold').length,
    exported: items.filter((item) => item.status === 'exported').length,
  };
}

function buildBillingEvidenceLabel(billingEvent: BillingEventRecord): string {
  const source = billingEvent.payload.source;
  const service = billingEvent.payload.service;
  const completedAt = formatDateTime(service?.completedAt ?? null);

  const sourceDetail = source?.movementId
    ? `Movement ${formatShortId(source.movementId)}`
    : `Service ${formatShortId(source?.movementServiceId ?? billingEvent.movementServiceId)}`;

  return completedAt === '-' ? sourceDetail : `${sourceDetail} · Completed ${completedAt}`;
}

function formatShortId(value: string): string {
  return value.slice(0, 8);
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
