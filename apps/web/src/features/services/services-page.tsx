'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type {
  CreateServiceCatalogInput,
  PaginatedResponse,
  ServiceCatalogRecord,
  ServiceCatalogStatus,
  ServiceCategory,
} from '@vms/shared';
import { serviceCatalogStatuses, serviceCategories } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';

import { createService, deleteService, listServices, updateService } from './api';
import { ServiceForm } from './service-form';

const initialPage: PaginatedResponse<ServiceCatalogRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function ServicesPage() {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ServiceCatalogStatus | ''>('');
  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [billableFilter, setBillableFilter] = useState<'any' | 'true' | 'false'>('any');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogRecord | undefined>();
  const [error, setError] = useState<string | null>(null);
  const currentPageSummary = useMemo(() => buildServiceSummary(page.data), [page.data]);

  async function loadServices(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listServices({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        category: category || undefined,
        isBillable: billableFilter === 'any' ? undefined : billableFilter === 'true',
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load services.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialServices() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listServices({
          page: 1,
          pageSize: 10,
          sortBy: 'name',
          sortDirection: 'asc',
        });
        setPage(result);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load services.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialServices();
  }, []);

  async function submitService(input: CreateServiceCatalogInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingService) {
        await updateService(editingService.id, input);
      } else {
        await createService(input);
      }
      setIsEditorOpen(false);
      setEditingService(undefined);
      await loadServices(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save service.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeService(service: ServiceCatalogRecord) {
    if (!window.confirm(`Delete service ${service.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      await deleteService(service.id);
      await loadServices(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete service.');
    }
  }

  function openCreatePanel() {
    setEditingService(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(service: ServiceCatalogRecord) {
    setEditingService(service);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingService(undefined);
  }

  function handleServiceRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    service: ServiceCatalogRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(service);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Marine services"
          title="Services"
          description="Manage the controlled catalog used for movement services, providers, and future invoicing."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total services
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
              New service
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Service KPIs">
          <KpiCard
            label="Visible services"
            value={String(page.data.length)}
            detail="Current board"
          />
          <KpiCard
            label="Billable"
            value={String(currentPageSummary.billable)}
            detail="ERP billing source"
          />
          <KpiCard
            label="Active"
            value={String(currentPageSummary.active)}
            detail="Available for use"
          />
          <KpiCard
            label="Categories"
            value={String(currentPageSummary.categories)}
            detail="Distinct service types"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Service board</h2>
              <p className="mt-1 text-sm text-steel">
                Search, filter, and maintain the controlled marine service catalog.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_9rem_10rem_9rem_auto]">
              <input
                placeholder="Search services"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ServiceCatalogStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {serviceCatalogStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ServiceCategory | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by category"
              >
                <option value="">Any category</option>
                {serviceCategories.map((option) => (
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by billable flag"
              >
                <option value="any">Any billing</option>
                <option value="true">Billable</option>
                <option value="false">Non-billable</option>
              </select>
              <button
                onClick={() => void loadServices(1)}
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
                    <th className="py-3 pr-4">Unit</th>
                    <th className="py-3 pr-4">Billable</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((service) => (
                    <tr
                      key={service.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(service)}
                      onKeyDown={(event) => handleServiceRowKeyDown(event, service)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">{service.name}</td>
                      <td className="py-3 pr-4 text-steel">{service.code}</td>
                      <td className="py-3 pr-4 text-steel">{service.category}</td>
                      <td className="py-3 pr-4 text-steel">{service.defaultUnit}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-steel">
                          {service.isBillable ? 'Billable' : 'Non-billable'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(service);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeService(service);
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
                  title="No services match this view"
                  description="Adjust the filters or create a service before attaching work to movements."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading services...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} services
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadServices(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadServices(currentPage + 1)}
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
        title={editingService ? 'Edit service' : 'New service'}
        description="Maintain the marine service catalog used for movement services and billing events."
        onClose={closeEditor}
      >
        <ServiceForm
          key={editingService?.id ?? 'new-service'}
          service={editingService}
          isSubmitting={isSubmitting}
          onSubmit={submitService}
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

function buildServiceSummary(items: readonly ServiceCatalogRecord[]) {
  return {
    billable: items.filter((item) => item.isBillable).length,
    active: items.filter((item) => item.status === 'active').length,
    categories: new Set(items.map((item) => item.category)).size,
  };
}
