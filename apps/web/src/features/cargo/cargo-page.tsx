'use client';

import { useEffect, useState } from 'react';

import type {
  CargoCategory,
  CargoItemRecord,
  CargoItemStatus,
  CreateCargoItemInput,
  PaginatedResponse,
} from '@vms/shared';
import { cargoCategories, cargoItemStatuses } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { createCargoItem, deleteCargoItem, listCargoItems, updateCargoItem } from './api';
import { CargoForm } from './cargo-form';

const initialPage: PaginatedResponse<CargoItemRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function CargoPage() {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CargoItemStatus | ''>('');
  const [cargoCategory, setCargoCategory] = useState<CargoCategory | ''>('');
  const [hazardFilter, setHazardFilter] = useState<'any' | 'true' | 'false'>('any');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCargoItem, setEditingCargoItem] = useState<CargoItemRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function loadCargoItems(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listCargoItems({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        cargoCategory: cargoCategory || undefined,
        isHazardous: hazardFilter === 'any' ? undefined : hazardFilter === 'true',
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load cargo.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialCargoItems() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listCargoItems({
          page: 1,
          pageSize: 10,
          sortBy: 'name',
          sortDirection: 'asc',
        });
        setPage(result);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load cargo.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialCargoItems();
  }, []);

  async function submitCargoItem(input: CreateCargoItemInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingCargoItem) {
        await updateCargoItem(editingCargoItem.id, input);
      } else {
        await createCargoItem(input);
      }
      setEditingCargoItem(undefined);
      await loadCargoItems(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save cargo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeCargoItem(cargoItem: CargoItemRecord) {
    if (!window.confirm(`Delete cargo ${cargoItem.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      await deleteCargoItem(cargoItem.id);
      await loadCargoItems(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete cargo.');
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Cargo catalog
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Cargo</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage cargo master data used by future movement cargo, hazardous checks, and
              throughput reporting.
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

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <CargoForm
            cargoItem={editingCargoItem}
            isSubmitting={isSubmitting}
            onSubmit={submitCargoItem}
            onCancel={editingCargoItem ? () => setEditingCargoItem(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_9rem_10rem_9rem_auto]">
              <input
                placeholder="Search cargo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as CargoItemStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {cargoItemStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={cargoCategory}
                onChange={(event) => setCargoCategory(event.target.value as CargoCategory | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by category"
              >
                <option value="">Any category</option>
                {cargoCategories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={hazardFilter}
                onChange={(event) =>
                  setHazardFilter(event.target.value as 'any' | 'true' | 'false')
                }
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by hazardous flag"
              >
                <option value="any">Any risk</option>
                <option value="true">Hazardous</option>
                <option value="false">Non-hazardous</option>
              </select>
              <button
                onClick={() => void loadCargoItems(1)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">UN number</th>
                    <th className="py-3 pr-4">Hazardous</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((cargoItem) => (
                    <tr key={cargoItem.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{cargoItem.name}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.cargoCode}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.cargoCategory}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.unNumber ?? '-'}</td>
                      <td className="py-3 pr-4 text-steel">
                        {cargoItem.isHazardous ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingCargoItem(cargoItem)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeCargoItem(cargoItem)}
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
                  No cargo items match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading cargo...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} cargo items
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page.meta.page <= 1}
                  onClick={() => void loadCargoItems(page.meta.page - 1)}
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page.meta.page >= page.meta.totalPages}
                  onClick={() => void loadCargoItems(page.meta.page + 1)}
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
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
