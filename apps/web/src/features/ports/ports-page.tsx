'use client';

import { useEffect, useState } from 'react';

import type { CreatePortInput, PaginatedResponse, PortRecord, PortStatus } from '@vms/shared';
import { portStatuses } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { createPort, deletePort, listPorts, updatePort } from './api';
import { PortForm } from './port-form';

const initialPage: PaginatedResponse<PortRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function PortsPage() {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PortStatus | ''>('');
  const [countryId, setCountryId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPort, setEditingPort] = useState<PortRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function loadPorts(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listPorts({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        countryId,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load ports.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialPorts() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listPorts({
          page: 1,
          pageSize: 10,
          sortBy: 'name',
          sortDirection: 'asc',
        });
        setPage(result);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load ports.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialPorts();
  }, []);

  async function submitPort(input: CreatePortInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingPort) {
        await updatePort(editingPort.id, input);
      } else {
        await createPort(input);
      }
      setEditingPort(undefined);
      await loadPorts(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save port.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removePort(port: PortRecord) {
    if (!window.confirm(`Delete port ${port.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      await deletePort(port.id);
      await loadPorts(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete port.');
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Port registry
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Ports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage port master data used by movements, terminals, berths, services, and port-call
              reporting.
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
          <PortForm
            port={editingPort}
            isSubmitting={isSubmitting}
            onSubmit={submitPort}
            onCancel={editingPort ? () => setEditingPort(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_1fr_auto]">
              <input
                placeholder="Search ports"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as PortStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {portStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                placeholder="Country ID"
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <button
                onClick={() => void loadPorts(1)}
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
                    <th className="py-3 pr-4">UN/LOCODE</th>
                    <th className="py-3 pr-4">Time zone</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((port) => (
                    <tr key={port.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{port.name}</td>
                      <td className="py-3 pr-4 text-steel">{port.unlocode}</td>
                      <td className="py-3 pr-4 text-steel">{port.timeZone}</td>
                      <td className="py-3 pr-4 text-steel">{port.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingPort(port)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removePort(port)}
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
                  No ports match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading ports...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} ports
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page.meta.page <= 1}
                  onClick={() => void loadPorts(page.meta.page - 1)}
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page.meta.page >= page.meta.totalPages}
                  onClick={() => void loadPorts(page.meta.page + 1)}
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
