'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  CreateMovementServiceInput,
  MovementRecord,
  MovementServiceRecord,
  MovementServiceStatus,
  PaginatedResponse,
  ServiceCatalogRecord,
} from '@vms/shared';
import { movementServiceStatuses } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';
import { listMovements } from '@/features/movements/api';
import { listServices } from '@/features/services/api';

import {
  createMovementService,
  deleteMovementService,
  listMovementServices,
  updateMovementService,
} from './api';
import { MovementServiceForm } from './movement-service-form';

const initialPage: PaginatedResponse<MovementServiceRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function MovementServicesPage() {
  const [page, setPage] = useState(initialPage);
  const [movements, setMovements] = useState<readonly MovementRecord[]>([]);
  const [services, setServices] = useState<readonly ServiceCatalogRecord[]>([]);
  const [status, setStatus] = useState<MovementServiceStatus | ''>('');
  const [billableFilter, setBillableFilter] = useState<'any' | 'true' | 'false'>('any');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMovementService, setEditingMovementService] = useState<
    MovementServiceRecord | undefined
  >();
  const [error, setError] = useState<string | null>(null);

  const movementLabels = useMemo(
    () =>
      new Map(
        movements.map((movement) => [
          movement.id,
          `${movement.movementReference} · ${movement.movementType}`,
        ]),
      ),
    [movements],
  );
  const serviceLabels = useMemo(
    () => new Map(services.map((service) => [service.id, `${service.name} (${service.code})`])),
    [services],
  );

  async function loadMovementServices(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listMovementServices({
        page: nextPage,
        pageSize: 10,
        status: status || undefined,
        isBillable: billableFilter === 'any' ? undefined : billableFilter === 'true',
        sortBy: 'requestedAt',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load movement services.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [movementResult, serviceResult, movementServiceResult] = await Promise.all([
          listMovements({ page: 1, pageSize: 100, sortBy: 'plannedAt', sortDirection: 'asc' }),
          listServices({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listMovementServices({
            page: 1,
            pageSize: 10,
            sortBy: 'requestedAt',
            sortDirection: 'asc',
          }),
        ]);

        setMovements(movementResult.data);
        setServices(serviceResult.data);
        setPage(movementServiceResult);
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load movement services.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitMovementService(input: CreateMovementServiceInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingMovementService) {
        await updateMovementService(editingMovementService.id, input);
      } else {
        await createMovementService(input);
      }
      setEditingMovementService(undefined);
      await loadMovementServices(1);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to save movement service.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeMovementService(movementService: MovementServiceRecord) {
    setError(null);

    try {
      await deleteMovementService(movementService.id);
      await loadMovementServices(currentPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to cancel movement service.',
      );
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Billing enablement
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Movement Services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Attach performed marine services to movements so billing events can later be reviewed
              and exported to ERP systems.
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
          <MovementServiceForm
            key={editingMovementService?.id ?? 'new-movement-service'}
            movementService={editingMovementService}
            movements={movements}
            services={services}
            isSubmitting={isSubmitting}
            onSubmit={submitMovementService}
            onCancel={
              editingMovementService ? () => setEditingMovementService(undefined) : undefined
            }
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_auto]">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MovementServiceStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {movementServiceStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={billableFilter}
                onChange={(event) =>
                  setBillableFilter(event.target.value as 'any' | 'true' | 'false')
                }
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by billable flag"
              >
                <option value="any">Any billing</option>
                <option value="true">Billable</option>
                <option value="false">Non-billable</option>
              </select>
              <button
                onClick={() => void loadMovementServices(1)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Movement</th>
                    <th className="py-3 pr-4">Service</th>
                    <th className="py-3 pr-4">Quantity</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Billable</th>
                    <th className="py-3 pr-4">Completed</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((movementService) => (
                    <tr key={movementService.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {movementLabels.get(movementService.movementId) ??
                          movementService.movementId}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {serviceLabels.get(movementService.serviceId) ?? movementService.serviceId}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {movementService.quantity} {movementService.unitOfMeasure}
                      </td>
                      <td className="py-3 pr-4 text-steel">{movementService.status}</td>
                      <td className="py-3 pr-4 text-steel">
                        {movementService.isBillable ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {formatDateTime(movementService.completedAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingMovementService(movementService)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeMovementService(movementService)}
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
                  No movement services match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading movement services...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} movement
                services
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadMovementServices(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadMovementServices(currentPage + 1)}
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
