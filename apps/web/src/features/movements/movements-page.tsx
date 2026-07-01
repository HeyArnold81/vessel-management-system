'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  CreateMovementInput,
  MovementRecord,
  MovementStatus,
  MovementType,
  PaginatedResponse,
  VesselCallRecord,
} from '@vms/shared';
import { movementStatuses, movementTypes } from '@vms/shared';

import { listVesselCalls } from '@/features/vessel-calls/api';
import { ApiClientError } from '@/lib/api/http';

import { createMovement, deleteMovement, listMovements, updateMovement } from './api';
import { MovementForm } from './movement-form';

const initialPage: PaginatedResponse<MovementRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function MovementsPage() {
  const [page, setPage] = useState(initialPage);
  const [vesselCalls, setVesselCalls] = useState<readonly VesselCallRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MovementStatus | ''>('');
  const [movementType, setMovementType] = useState<MovementType | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function loadMovements(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listMovements({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        movementType: movementType || undefined,
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

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Operations timeline
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Movements</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Track arrival, departure, berth shift, pilotage, towage, service, and cargo milestones
              underneath vessel calls.
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
          <MovementForm
            key={editingMovement?.id ?? 'new-movement'}
            movement={editingMovement}
            vesselCalls={vesselCalls}
            isSubmitting={isSubmitting}
            onSubmit={submitMovement}
            onCancel={editingMovement ? () => setEditingMovement(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_11rem_auto]">
              <input
                placeholder="Search movements"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MovementStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
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
                className="rounded-md border border-slate-300 px-3 py-2"
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

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Call</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Planned</th>
                    <th className="py-3 pr-4">Actual</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((movement) => (
                    <tr key={movement.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {movement.movementReference}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {callReferences.get(movement.vesselCallId) ?? movement.vesselCallId}
                      </td>
                      <td className="py-3 pr-4 text-steel">{movement.movementType}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(movement.plannedAt)}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(movement.actualAt)}</td>
                      <td className="py-3 pr-4 text-steel">{movement.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingMovement(movement)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeMovement(movement)}
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

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No movements match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading movements...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} movements
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadMovements(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadMovements(currentPage + 1)}
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
