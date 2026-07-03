'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { CreateVesselInput, PaginatedResponse, VesselRecord, VesselStatus } from '@vms/shared';
import { vesselStatuses, vesselTypes } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<VesselRecord | undefined>();
  const [error, setError] = useState<string | null>(null);
  const currentPageSummary = useMemo(() => buildVesselSummary(page.data), [page.data]);

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
      setIsEditorOpen(false);
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

  function openCreatePanel() {
    setEditingVessel(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(vessel: VesselRecord) {
    setEditingVessel(vessel);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingVessel(undefined);
  }

  function handleVesselRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, vessel: VesselRecord) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(vessel);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Fleet registry"
          title="Vessels"
          description="Manage vessel master data used by port calls, services, cargo operations, and invoicing."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total vessels
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
              New vessel
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Vessel KPIs">
          <KpiCard
            label="Visible vessels"
            value={String(page.data.length)}
            detail="Current board"
          />
          <KpiCard
            label="Active"
            value={String(currentPageSummary.active)}
            detail="Available for calls"
          />
          <KpiCard
            label="Inactive"
            value={String(currentPageSummary.inactive)}
            detail="Retired or unavailable"
          />
          <KpiCard
            label="Types"
            value={String(currentPageSummary.types)}
            detail="Distinct vessel classes"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Vessel board</h2>
              <p className="mt-1 text-sm text-steel">
                Search, filter, and maintain the controlled vessel registry.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_13rem_auto]">
              <input
                placeholder="Search vessels"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as VesselStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
          </div>

          <div className="overflow-x-auto">
            {page.data.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="px-5 py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">IMO</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((vessel) => (
                    <tr
                      key={vessel.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(vessel)}
                      onKeyDown={(event) => handleVesselRowKeyDown(event, vessel)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">{vessel.name}</td>
                      <td className="py-3 pr-4 text-steel">{vessel.imoNumber}</td>
                      <td className="py-3 pr-4 text-steel">{vessel.vesselType}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={vessel.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(vessel);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeVessel(vessel);
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
                  title="No vessels match this view"
                  description="Adjust the filters or create a vessel before planning vessel calls."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading vessels...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} vessels
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadVessels(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadVessels(currentPage + 1)}
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
        title={editingVessel ? 'Edit vessel' : 'New vessel'}
        description="Maintain the controlled vessel registry used across port calls, services, cargo, and billing."
        onClose={closeEditor}
      >
        <VesselForm
          key={editingVessel?.id ?? 'new-vessel'}
          vessel={editingVessel}
          isSubmitting={isSubmitting}
          onSubmit={submitVessel}
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

function buildVesselSummary(items: readonly VesselRecord[]) {
  return {
    active: items.filter((item) => item.status === 'active').length,
    inactive: items.filter((item) => item.status === 'inactive').length,
    types: new Set(items.map((item) => item.vesselType)).size,
  };
}
