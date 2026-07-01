'use client';

import { useEffect, useState } from 'react';

import type { CreateVesselInput, PaginatedResponse, VesselRecord, VesselStatus } from '@vms/shared';
import { vesselStatuses, vesselTypes } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { createVessel, deleteVessel, listVessels, updateVessel } from './api';
import { VesselForm } from './vessel-form';

const initialPage: PaginatedResponse<VesselRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function VesselsPage() {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VesselStatus | ''>('');
  const [vesselType, setVesselType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVessel, setEditingVessel] = useState<VesselRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function loadVessels(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listVessels({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        vesselType,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load vessels.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialVessels() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listVessels({
          page: 1,
          pageSize: 10,
          sortBy: 'name',
          sortDirection: 'asc',
        });
        setPage(result);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load vessels.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialVessels();
  }, []);

  async function submitVessel(input: CreateVesselInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingVessel) {
        await updateVessel(editingVessel.id, input);
      } else {
        await createVessel(input);
      }
      setEditingVessel(undefined);
      await loadVessels(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save vessel.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeVessel(vessel: VesselRecord) {
    if (!window.confirm(`Delete vessel ${vessel.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      await deleteVessel(vessel.id);
      await loadVessels(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete vessel.');
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Fleet registry
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Vessels</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage vessel master data used by port calls, services, cargo operations, and
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
          <VesselForm
            vessel={editingVessel}
            isSubmitting={isSubmitting}
            onSubmit={submitVessel}
            onCancel={editingVessel ? () => setEditingVessel(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_13rem_auto]">
              <input
                placeholder="Search vessels"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as VesselStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {vesselStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={vesselType}
                onChange={(event) => setVesselType(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by vessel type"
              >
                <option value="">Any type</option>
                {vesselTypes.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <button
                onClick={() => void loadVessels(1)}
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
                    <th className="py-3 pr-4">IMO</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((vessel) => (
                    <tr key={vessel.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">{vessel.name}</td>
                      <td className="py-3 pr-4 text-steel">{vessel.imoNumber}</td>
                      <td className="py-3 pr-4 text-steel">{vessel.vesselType}</td>
                      <td className="py-3 pr-4 text-steel">{vessel.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingVessel(vessel)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeVessel(vessel)}
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
                  No vessels match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading vessels...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} vessels
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page.meta.page <= 1}
                  onClick={() => void loadVessels(page.meta.page - 1)}
                  className="rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page.meta.page >= page.meta.totalPages}
                  onClick={() => void loadVessels(page.meta.page + 1)}
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
