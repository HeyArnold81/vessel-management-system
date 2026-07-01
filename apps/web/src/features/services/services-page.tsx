'use client';

import { useEffect, useState } from 'react';

import type {
  CreateServiceCatalogInput,
  PaginatedResponse,
  ServiceCatalogRecord,
  ServiceCatalogStatus,
  ServiceCategory,
} from '@vms/shared';
import { serviceCatalogStatuses, serviceCategories } from '@vms/shared';

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
  const [editingService, setEditingService] = useState<ServiceCatalogRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Marine services
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Services</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage the controlled catalog used for movement services, providers, and future
              invoicing.
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
          <ServiceForm
            key={editingService?.id ?? 'new-service'}
            service={editingService}
            isSubmitting={isSubmitting}
            onSubmit={submitService}
            onCancel={editingService ? () => setEditingService(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_9rem_10rem_9rem_auto]">
              <input
                placeholder="Search services"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as ServiceCatalogStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
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
                className="rounded-md border border-slate-300 px-3 py-2"
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
                className="rounded-md border border-slate-300 px-3 py-2"
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

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Code</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Unit</th>
                    <th className="py-3 pr-4">Billable</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((service) => (
                    <tr key={service.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{service.name}</td>
                      <td className="py-3 pr-4 text-steel">{service.code}</td>
                      <td className="py-3 pr-4 text-steel">{service.category}</td>
                      <td className="py-3 pr-4 text-steel">{service.defaultUnit}</td>
                      <td className="py-3 pr-4 text-steel">{service.isBillable ? 'Yes' : 'No'}</td>
                      <td className="py-3 pr-4 text-steel">{service.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingService(service)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeService(service)}
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
                  No services match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading services...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} services
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadServices(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadServices(currentPage + 1)}
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
