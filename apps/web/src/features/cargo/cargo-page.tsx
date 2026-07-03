'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type {
  CargoCategory,
  CargoItemRecord,
  CargoItemStatus,
  CreateCargoItemInput,
  PaginatedResponse,
} from '@vms/shared';
import { cargoCategories, cargoItemStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCargoItem, setEditingCargoItem] = useState<CargoItemRecord | undefined>();
  const [error, setError] = useState<string | null>(null);
  const currentPageSummary = useMemo(() => buildCargoSummary(page.data), [page.data]);

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
      setIsEditorOpen(false);
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

  function openCreatePanel() {
    setEditingCargoItem(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(cargoItem: CargoItemRecord) {
    setEditingCargoItem(cargoItem);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingCargoItem(undefined);
  }

  function handleCargoRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    cargoItem: CargoItemRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(cargoItem);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Cargo catalog"
          title="Cargo"
          description="Manage cargo master data used by future movement cargo, hazardous checks, and throughput reporting."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total cargo items
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Sorted by name
              </span>
            </div>
          }
          actions={
            <button
              type="button"
              onClick={openCreatePanel}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-panel"
            >
              New cargo
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Cargo KPIs">
          <KpiCard label="Visible cargo" value={String(page.data.length)} detail="Current board" />
          <KpiCard
            label="Hazardous"
            value={String(currentPageSummary.hazardous)}
            detail="Requires controls"
          />
          <KpiCard
            label="Active"
            value={String(currentPageSummary.active)}
            detail="Available for use"
          />
          <KpiCard
            label="Categories"
            value={String(currentPageSummary.categories)}
            detail="Distinct cargo classes"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Cargo board</h2>
              <p className="mt-1 text-sm text-steel">
                Search, filter, and maintain the controlled cargo catalog.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_9rem_10rem_9rem_auto]">
              <input
                placeholder="Search cargo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as CargoItemStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
          </div>

          <div className="overflow-x-auto">
            {page.data.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="px-5 py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">UN number</th>
                    <th className="py-3 pr-4">Hazardous</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((cargoItem) => (
                    <tr
                      key={cargoItem.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(cargoItem)}
                      onKeyDown={(event) => handleCargoRowKeyDown(event, cargoItem)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">{cargoItem.name}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.cargoCode}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.cargoCategory}</td>
                      <td className="py-3 pr-4 text-steel">{cargoItem.unNumber ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-steel">
                          {cargoItem.isHazardous ? 'Hazardous' : 'Non-hazardous'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={cargoItem.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(cargoItem);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeCargoItem(cargoItem);
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
                  title="No cargo items match this view"
                  description="Adjust the filters or create cargo master data for future cargo operations."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading cargo...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} cargo items
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadCargoItems(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadCargoItems(currentPage + 1)}
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
        title={editingCargoItem ? 'Edit cargo' : 'New cargo'}
        description="Maintain cargo master data used for future cargo operations, hazardous checks, and reporting."
        onClose={closeEditor}
      >
        <CargoForm
          key={editingCargoItem?.id ?? 'new-cargo'}
          cargoItem={editingCargoItem}
          isSubmitting={isSubmitting}
          onSubmit={submitCargoItem}
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

function buildCargoSummary(items: readonly CargoItemRecord[]) {
  return {
    hazardous: items.filter((item) => item.isHazardous).length,
    active: items.filter((item) => item.status === 'active').length,
    categories: new Set(items.map((item) => item.cargoCategory)).size,
  };
}
