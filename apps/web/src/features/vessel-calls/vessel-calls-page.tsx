'use client';

import { useEffect, useMemo, useState } from 'react';

import type {
  CreateVesselCallInput,
  PaginatedResponse,
  PortRecord,
  VesselCallRecord,
  VesselCallStatus,
  VesselRecord,
} from '@vms/shared';
import { vesselCallStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';
import { listPorts } from '@/features/ports/api';
import { listVessels } from '@/features/vessels/api';

import { createVesselCall, deleteVesselCall, listVesselCalls, updateVesselCall } from './api';
import { VesselCallForm } from './vessel-call-form';

const initialPage: PaginatedResponse<VesselCallRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

const savedViews: readonly {
  label: string;
  status: VesselCallStatus | '';
}[] = [
  { label: 'All calls', status: '' },
  { label: 'Expected', status: 'expected' },
  { label: 'Alongside', status: 'alongside' },
  { label: 'Departed', status: 'departed' },
];

export function VesselCallsPage() {
  const [page, setPage] = useState(initialPage);
  const [vessels, setVessels] = useState<readonly VesselRecord[]>([]);
  const [ports, setPorts] = useState<readonly PortRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VesselCallStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVesselCall, setEditingVesselCall] = useState<VesselCallRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  const vesselNames = useMemo(
    () => new Map(vessels.map((vessel) => [vessel.id, `${vessel.name} (${vessel.imoNumber})`])),
    [vessels],
  );
  const portNames = useMemo(
    () => new Map(ports.map((port) => [port.id, `${port.name} (${port.unlocode})`])),
    [ports],
  );
  const currentPageSummary = useMemo(() => buildVesselCallSummary(page.data), [page.data]);

  async function loadVesselCalls(
    nextPage = currentPage,
    nextStatus: VesselCallStatus | '' = status,
    nextSearch = search,
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listVesselCalls({
        page: nextPage,
        pageSize: 10,
        search: nextSearch,
        status: nextStatus || undefined,
        sortBy: 'eta',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load vessel calls.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [vesselResult, portResult, callResult] = await Promise.all([
          listVessels({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listPorts({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listVesselCalls({ page: 1, pageSize: 10, sortBy: 'eta', sortDirection: 'asc' }),
        ]);

        setVessels(vesselResult.data);
        setPorts(portResult.data);
        setPage(callResult);
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load vessel calls.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitVesselCall(input: CreateVesselCallInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingVesselCall) {
        await updateVesselCall(editingVesselCall.id, input);
      } else {
        await createVesselCall(input);
      }
      setIsEditorOpen(false);
      setEditingVesselCall(undefined);
      await loadVesselCalls(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save vessel call.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeVesselCall(vesselCall: VesselCallRecord) {
    if (
      !window.confirm(
        `Delete vessel call ${vesselCall.callReference}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteVesselCall(vesselCall.id);
      await loadVesselCalls(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete vessel call.');
    }
  }

  function openCreatePanel() {
    setEditingVesselCall(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(vesselCall: VesselCallRecord) {
    setEditingVesselCall(vesselCall);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingVesselCall(undefined);
  }

  function applySavedView(nextStatus: VesselCallStatus | '') {
    setStatus(nextStatus);
    void loadVesselCalls(1, nextStatus);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Operations workspace"
          title="Vessel Calls"
          description="Control inbound, alongside, and outbound vessel visits before movements, services, cargo, and billing activity are attached."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total calls
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Sorted by ETA
              </span>
            </div>
          }
          actions={
            <button
              type="button"
              onClick={openCreatePanel}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-panel"
            >
              New vessel call
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Vessel call KPIs">
          <KpiCard label="Visible calls" value={String(page.data.length)} detail="Current board" />
          <KpiCard
            label="Expected"
            value={String(currentPageSummary.expected)}
            detail="Arrivals being planned"
          />
          <KpiCard
            label="Alongside"
            value={String(currentPageSummary.alongside)}
            detail="Currently at berth"
          />
          <KpiCard
            label="Departed"
            value={String(currentPageSummary.departed)}
            detail="Completed visits"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Call board</h2>
                <p className="mt-1 text-sm text-steel">
                  Work the active vessel call list and open records only when action is needed.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedViews.map((view) => (
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

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_11rem_auto]">
              <input
                placeholder="Search calls"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as VesselCallStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {vesselCallStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadVesselCalls(1)}
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
                    <th className="px-5 py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Vessel</th>
                    <th className="py-3 pr-4">Port</th>
                    <th className="py-3 pr-4">ETA</th>
                    <th className="py-3 pr-4">ETD</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((vesselCall) => (
                    <tr key={vesselCall.id} className="hover:bg-surface/70">
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        <button
                          type="button"
                          onClick={() => openEditPanel(vesselCall)}
                          className="text-left font-semibold text-ink hover:text-harbor"
                        >
                          {vesselCall.callReference}
                        </button>
                        {vesselCall.voyageNumber ? (
                          <p className="mt-1 text-xs font-normal text-steel">
                            Voyage {vesselCall.voyageNumber}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {vesselNames.get(vesselCall.vesselId) ?? vesselCall.vesselId}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {portNames.get(vesselCall.portId) ?? vesselCall.portId}
                      </td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(vesselCall.eta)}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(vesselCall.etd)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={vesselCall.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditPanel(vesselCall)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeVesselCall(vesselCall)}
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
                  title="No vessel calls match this view"
                  description="Adjust the filters or create a new vessel call to start planning an arrival, departure, or berth stay."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading vessel calls...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} vessel calls
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadVesselCalls(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadVesselCalls(currentPage + 1)}
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
        title={editingVesselCall ? 'Edit vessel call' : 'New vessel call'}
        description="Capture the core visit information before movements, services, and billing activity are attached."
        onClose={closeEditor}
      >
        <VesselCallForm
          key={editingVesselCall?.id ?? 'new-call'}
          vesselCall={editingVesselCall}
          vessels={vessels}
          ports={ports}
          isSubmitting={isSubmitting}
          onSubmit={submitVesselCall}
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

function buildVesselCallSummary(items: readonly VesselCallRecord[]) {
  return {
    expected: items.filter((item) => item.status === 'expected').length,
    alongside: items.filter((item) => item.status === 'alongside').length,
    departed: items.filter((item) => item.status === 'departed').length,
  };
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
