'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { CreatePortInput, PaginatedResponse, PortRecord, PortStatus } from '@vms/shared';
import { portStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<PortRecord | undefined>();
  const [error, setError] = useState<string | null>(null);
  const currentPageSummary = useMemo(() => buildPortSummary(page.data), [page.data]);

  async function loadPorts(nextPage = currentPage, nextStatus: PortStatus | '' = status) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listPorts({
        page: nextPage,
        pageSize: 10,
        search,
        status: nextStatus || undefined,
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
      setIsEditorOpen(false);
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

  function openCreatePanel() {
    setEditingPort(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(port: PortRecord) {
    setEditingPort(port);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingPort(undefined);
  }

  function handlePortRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, port: PortRecord) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(port);
    }
  }

  function applySavedView(nextStatus: PortStatus | '') {
    setStatus(nextStatus);
    void loadPorts(1, nextStatus);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Port registry"
          title="Ports"
          description="Manage port master data used by movements, terminals, berths, services, and port-call reporting."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total ports
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
              New port
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Port KPIs">
          <KpiCard label="Visible ports" value={String(page.data.length)} detail="Current board" />
          <KpiCard
            label="Active"
            value={String(currentPageSummary.active)}
            detail="Available for operations"
          />
          <KpiCard
            label="Inactive"
            value={String(currentPageSummary.inactive)}
            detail="Retired or unavailable"
          />
          <KpiCard
            label="Time zones"
            value={String(currentPageSummary.timeZones)}
            detail="Distinct operating zones"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Port board</h2>
                <p className="mt-1 text-sm text-steel">
                  Search, filter, and maintain the controlled port registry.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All ports', status: '' as PortStatus | '' },
                  { label: 'Active', status: 'active' as PortStatus },
                  { label: 'Inactive', status: 'inactive' as PortStatus },
                ].map((view) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => applySavedView(view.status)}
                    className={
                      status === view.status
                        ? 'rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-steel'
                    }
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_1fr_auto]">
              <input
                placeholder="Search ports"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as PortStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <button
                onClick={() => void loadPorts(1)}
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
                    <th className="py-3 pr-4">UN/LOCODE</th>
                    <th className="py-3 pr-4">Time zone</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((port) => (
                    <tr
                      key={port.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(port)}
                      onKeyDown={(event) => handlePortRowKeyDown(event, port)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">{port.name}</td>
                      <td className="py-3 pr-4 text-steel">{port.unlocode}</td>
                      <td className="py-3 pr-4 text-steel">{port.timeZone}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={port.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(port);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removePort(port);
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
                  title="No ports match this view"
                  description="Adjust the filters or create a port before linking terminals, berths, and vessel calls."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading ports...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} ports
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadPorts(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadPorts(currentPage + 1)}
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
        title={editingPort ? 'Edit port' : 'New port'}
        description="Maintain the controlled port registry used across operations, services, reporting, and billing."
        onClose={closeEditor}
      >
        <PortForm
          key={editingPort?.id ?? 'new-port'}
          port={editingPort}
          isSubmitting={isSubmitting}
          onSubmit={submitPort}
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

function buildPortSummary(items: readonly PortRecord[]) {
  return {
    active: items.filter((item) => item.status === 'active').length,
    inactive: items.filter((item) => item.status === 'inactive').length,
    timeZones: new Set(items.map((item) => item.timeZone)).size,
  };
}
