'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { BerthRecord, BerthStatus, CreateBerthInput, PaginatedResponse } from '@vms/shared';
import { berthStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';

import { createBerth, deleteBerth, listBerths, updateBerth } from './api';
import { BerthForm } from './berth-form';

const initialPage: PaginatedResponse<BerthRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function BerthsPage() {
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BerthStatus | ''>('');
  const [terminalId, setTerminalId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBerth, setEditingBerth] = useState<BerthRecord | undefined>();
  const [error, setError] = useState<string | null>(null);
  const currentPageSummary = useMemo(() => buildBerthSummary(page.data), [page.data]);

  async function loadBerths(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listBerths({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        terminalId,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load berths.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialBerths() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await listBerths({
          page: 1,
          pageSize: 10,
          sortBy: 'name',
          sortDirection: 'asc',
        });
        setPage(result);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load berths.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialBerths();
  }, []);

  async function submitBerth(input: CreateBerthInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBerth) {
        await updateBerth(editingBerth.id, input);
      } else {
        await createBerth(input);
      }
      setIsEditorOpen(false);
      setEditingBerth(undefined);
      await loadBerths(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save berth.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeBerth(berth: BerthRecord) {
    if (!window.confirm(`Delete berth ${berth.name}? This action cannot be undone.`)) {
      return;
    }

    setError(null);

    try {
      await deleteBerth(berth.id);
      await loadBerths(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete berth.');
    }
  }

  function openCreatePanel() {
    setEditingBerth(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(berth: BerthRecord) {
    setEditingBerth(berth);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingBerth(undefined);
  }

  function handleBerthRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, berth: BerthRecord) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(berth);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Berth registry"
          title="Berths"
          description="Manage berth master data used by port calls, berth stays, draft checks, and capacity planning."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total berths
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
              New berth
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Berth KPIs">
          <KpiCard label="Visible berths" value={String(page.data.length)} detail="Current board" />
          <KpiCard
            label="Active"
            value={String(currentPageSummary.active)}
            detail="Available for planning"
          />
          <KpiCard
            label="With length limits"
            value={String(currentPageSummary.withLength)}
            detail="LOA constrained"
          />
          <KpiCard
            label="With draft limits"
            value={String(currentPageSummary.withDraft)}
            detail="Draft constrained"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Berth board</h2>
              <p className="mt-1 text-sm text-steel">
                Search, filter, and maintain berth planning master data.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_1fr_auto]">
              <input
                placeholder="Search berths"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BerthStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {berthStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                placeholder="Terminal ID"
                value={terminalId}
                onChange={(event) => setTerminalId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
              <button
                onClick={() => void loadBerths(1)}
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
                    <th className="py-3 pr-4">Max length</th>
                    <th className="py-3 pr-4">Max draft</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((berth) => (
                    <tr
                      key={berth.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(berth)}
                      onKeyDown={(event) => handleBerthRowKeyDown(event, berth)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">{berth.name}</td>
                      <td className="py-3 pr-4 text-steel">{berth.code}</td>
                      <td className="py-3 pr-4 text-steel">{berth.maxLengthM ?? '-'}</td>
                      <td className="py-3 pr-4 text-steel">{berth.maxDraftM ?? '-'}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={berth.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(berth);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeBerth(berth);
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
                  title="No berths match this view"
                  description="Adjust the filters or create a berth before assigning vessel calls."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading berths...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} berths
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadBerths(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadBerths(currentPage + 1)}
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
        title={editingBerth ? 'Edit berth' : 'New berth'}
        description="Maintain berth planning data used by vessel calls, draft checks, and capacity planning."
        onClose={closeEditor}
      >
        <BerthForm
          key={editingBerth?.id ?? 'new-berth'}
          berth={editingBerth}
          isSubmitting={isSubmitting}
          onSubmit={submitBerth}
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

function buildBerthSummary(items: readonly BerthRecord[]) {
  return {
    active: items.filter((item) => item.status === 'active').length,
    withLength: items.filter((item) => item.maxLengthM !== null).length,
    withDraft: items.filter((item) => item.maxDraftM !== null).length,
  };
}
