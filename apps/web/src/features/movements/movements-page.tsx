'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type {
  CreateMovementInput,
  MovementRecord,
  MovementStatus,
  MovementType,
  PaginatedResponse,
  VesselCallRecord,
} from '@vms/shared';
import { movementStatuses, movementTypes } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { listVesselCalls } from '@/features/vessel-calls/api';
import { ApiClientError } from '@/lib/api/http';

import { createMovement, deleteMovement, listMovements, updateMovement } from './api';
import { MovementForm } from './movement-form';

const initialPage: PaginatedResponse<MovementRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

const savedViews: readonly {
  label: string;
  status: MovementStatus | '';
  movementType: MovementType | '';
}[] = [
  { label: 'All movements', status: '', movementType: '' },
  { label: 'Arrivals', status: '', movementType: 'arrival' },
  { label: 'Departures', status: '', movementType: 'departure' },
  { label: 'In progress', status: 'in_progress', movementType: '' },
  { label: 'Completed', status: 'completed', movementType: '' },
];

export function MovementsPage() {
  const [page, setPage] = useState(initialPage);
  const [vesselCalls, setVesselCalls] = useState<readonly VesselCallRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MovementStatus | ''>('');
  const [movementType, setMovementType] = useState<MovementType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<MovementRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  const callReferences = useMemo(
    () =>
      new Map(
        vesselCalls.map((vesselCall) => [
          vesselCall.id,
          `${vesselCall.callReference} · ${vesselCall.status}`,
        ]),
      ),
    [vesselCalls],
  );
  const currentPageSummary = useMemo(() => buildMovementSummary(page.data), [page.data]);

  async function loadMovements(
    nextPage = currentPage,
    nextStatus: MovementStatus | '' = status,
    nextMovementType: MovementType | '' = movementType,
    nextSearch = search,
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listMovements({
        page: nextPage,
        pageSize: 10,
        search: nextSearch,
        status: nextStatus || undefined,
        movementType: nextMovementType || undefined,
        sortBy: 'plannedAt',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load movements.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [callResult, movementResult] = await Promise.all([
          listVesselCalls({ page: 1, pageSize: 100, sortBy: 'eta', sortDirection: 'asc' }),
          listMovements({ page: 1, pageSize: 10, sortBy: 'plannedAt', sortDirection: 'asc' }),
        ]);

        setVesselCalls(callResult.data);
        setPage(movementResult);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load movements.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitMovement(input: CreateMovementInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingMovement) {
        await updateMovement(editingMovement.id, input);
      } else {
        await createMovement(input);
      }
      setIsEditorOpen(false);
      setEditingMovement(undefined);
      await loadMovements(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save movement.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeMovement(movement: MovementRecord) {
    if (
      !window.confirm(
        `Delete movement ${movement.movementReference}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteMovement(movement.id);
      await loadMovements(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete movement.');
    }
  }

  function openCreatePanel() {
    setEditingMovement(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(movement: MovementRecord) {
    setEditingMovement(movement);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingMovement(undefined);
  }

  function handleMovementRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    movement: MovementRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(movement);
    }
  }

  function applySavedView(nextStatus: MovementStatus | '', nextMovementType: MovementType | '') {
    setStatus(nextStatus);
    setMovementType(nextMovementType);
    void loadMovements(1, nextStatus, nextMovementType);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Operations timeline"
          title="Movements"
          description="Track arrival, departure, berth shift, pilotage, towage, service, and cargo milestones underneath vessel calls."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total movements
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Sorted by planned time
              </span>
            </div>
          }
          actions={
            <button
              type="button"
              onClick={openCreatePanel}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-panel"
            >
              New movement
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Movement KPIs">
          <KpiCard
            label="Visible movements"
            value={String(page.data.length)}
            detail="Current board"
          />
          <KpiCard
            label="Arrivals"
            value={String(currentPageSummary.arrivals)}
            detail="Inbound records"
          />
          <KpiCard
            label="Departures"
            value={String(currentPageSummary.departures)}
            detail="Outbound records"
          />
          <KpiCard
            label="In progress"
            value={String(currentPageSummary.inProgress)}
            detail="Active operations"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Movement board</h2>
                <p className="mt-1 text-sm text-steel">
                  Coordinate movement milestones and open a record only when details need updating.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedViews.map((view) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => applySavedView(view.status, view.movementType)}
                    className={
                      status === view.status && movementType === view.movementType
                        ? 'rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-steel'
                    }
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_11rem_auto]">
              <input
                placeholder="Search movements"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MovementStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {movementStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={movementType}
                onChange={(event) => setMovementType(event.target.value as MovementType | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by movement type"
              >
                <option value="">Any type</option>
                {movementTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadMovements(1)}
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
                    <th className="py-3 pr-4">Call</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Planned</th>
                    <th className="py-3 pr-4">Actual</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((movement) => (
                    <tr
                      key={movement.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(movement)}
                      onKeyDown={(event) => handleMovementRowKeyDown(event, movement)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        <span className="font-semibold text-ink">{movement.movementReference}</span>
                        {movement.fromBerthId || movement.toBerthId ? (
                          <p className="mt-1 text-xs font-normal text-steel">
                            {movement.fromBerthId ?? '-'} to {movement.toBerthId ?? '-'}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {callReferences.get(movement.vesselCallId) ?? movement.vesselCallId}
                      </td>
                      <td className="py-3 pr-4 text-steel">{movement.movementType}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(movement.plannedAt)}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(movement.actualAt)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={movement.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(movement);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeMovement(movement);
                            }}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {!isLoading && page.data.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No movements match this view"
                  description="Adjust the filters or create a new movement to start coordinating arrival, departure, berth shift, or service milestones."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading movements...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} movements
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadMovements(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadMovements(currentPage + 1)}
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
        title={editingMovement ? 'Edit movement' : 'New movement'}
        description="Capture the movement milestone beneath a vessel call so services, billing, and reporting can follow the operational timeline."
        onClose={closeEditor}
      >
        <MovementForm
          key={editingMovement?.id ?? 'new-movement'}
          movement={editingMovement}
          vesselCalls={vesselCalls}
          isSubmitting={isSubmitting}
          onSubmit={submitMovement}
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

function buildMovementSummary(items: readonly MovementRecord[]) {
  return {
    arrivals: items.filter((item) => item.movementType === 'arrival').length,
    departures: items.filter((item) => item.movementType === 'departure').length,
    inProgress: items.filter((item) => item.status === 'in_progress').length,
  };
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
