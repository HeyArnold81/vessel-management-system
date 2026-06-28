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

import { ApiClientError } from '@/lib/api/http';
import { listPorts } from '@/features/ports/api';
import { listVessels } from '@/features/vessels/api';

import { createVesselCall, deleteVesselCall, listVesselCalls, updateVesselCall } from './api';
import { VesselCallForm } from './vessel-call-form';

const initialPage: PaginatedResponse<VesselCallRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function VesselCallsPage() {
  const [page, setPage] = useState(initialPage);
  const [vessels, setVessels] = useState<readonly VesselRecord[]>([]);
  const [ports, setPorts] = useState<readonly PortRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VesselCallStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function loadVesselCalls(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listVesselCalls({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
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
      setEditingVesselCall(undefined);
      await loadVesselCalls(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save vessel call.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeVesselCall(vesselCall: VesselCallRecord) {
    setError(null);

    try {
      await deleteVesselCall(vesselCall.id);
      await loadVesselCalls(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete vessel call.');
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">Operations</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Vessel Calls</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage port visits before detailed movement, pilotage, towage, cargo, and billing
              activity is attached.
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
          <VesselCallForm
            key={editingVesselCall?.id ?? 'new-call'}
            vesselCall={editingVesselCall}
            vessels={vessels}
            ports={ports}
            isSubmitting={isSubmitting}
            onSubmit={submitVesselCall}
            onCancel={editingVesselCall ? () => setEditingVesselCall(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_11rem_auto]">
              <input
                placeholder="Search calls"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as VesselCallStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
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

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Reference</th>
                    <th className="py-3 pr-4">Vessel</th>
                    <th className="py-3 pr-4">Port</th>
                    <th className="py-3 pr-4">ETA</th>
                    <th className="py-3 pr-4">ETD</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((vesselCall) => (
                    <tr key={vesselCall.id}>
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {vesselCall.callReference}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {vesselNames.get(vesselCall.vesselId) ?? vesselCall.vesselId}
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {portNames.get(vesselCall.portId) ?? vesselCall.portId}
                      </td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(vesselCall.eta)}</td>
                      <td className="py-3 pr-4 text-steel">{formatDateTime(vesselCall.etd)}</td>
                      <td className="py-3 pr-4 text-steel">{vesselCall.status}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingVesselCall(vesselCall)}
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

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No vessel calls match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading vessel calls...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} vessel
                calls
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadVesselCalls(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadVesselCalls(currentPage + 1)}
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
