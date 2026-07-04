'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type {
  CreateMovementServiceInput,
  MovementRecord,
  MovementServiceRecord,
  MovementServiceStatus,
  OrganizationRecord,
  PaginatedResponse,
  ServiceCatalogRecord,
} from '@vms/shared';
import { movementServiceStatuses } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { ApiClientError } from '@/lib/api/http';
import { listMovements } from '@/features/movements/api';
import { listOrganizations } from '@/features/organizations/api';
import { listServices } from '@/features/services/api';

import {
  createMovementService,
  deleteMovementService,
  listMovementServices,
  updateMovementService,
} from './api';
import { MovementServiceForm } from './movement-service-form';

const initialPage: PaginatedResponse<MovementServiceRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

const savedViews: readonly {
  label: string;
  status: MovementServiceStatus | '';
  billableFilter: 'any' | 'true' | 'false';
}[] = [
  { label: 'All services', status: '', billableFilter: 'any' },
  { label: 'Requested', status: 'requested', billableFilter: 'any' },
  { label: 'Scheduled', status: 'scheduled', billableFilter: 'any' },
  { label: 'Completed', status: 'completed', billableFilter: 'any' },
  { label: 'Billable', status: '', billableFilter: 'true' },
];

export function MovementServicesPage() {
  const [page, setPage] = useState(initialPage);
  const [movements, setMovements] = useState<readonly MovementRecord[]>([]);
  const [services, setServices] = useState<readonly ServiceCatalogRecord[]>([]);
  const [organizations, setOrganizations] = useState<readonly OrganizationRecord[]>([]);
  const [status, setStatus] = useState<MovementServiceStatus | ''>('');
  const [billableFilter, setBillableFilter] = useState<'any' | 'true' | 'false'>('any');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMovementService, setEditingMovementService] = useState<
    MovementServiceRecord | undefined
  >();
  const [error, setError] = useState<string | null>(null);

  const movementLabels = useMemo(
    () =>
      new Map(
        movements.map((movement) => [
          movement.id,
          `${movement.movementReference} · ${movement.movementType}`,
        ]),
      ),
    [movements],
  );
  const serviceLabels = useMemo(
    () => new Map(services.map((service) => [service.id, `${service.name} (${service.code})`])),
    [services],
  );
  const organizationLabels = useMemo(
    () =>
      new Map(
        organizations.map((organization) => [
          organization.id,
          formatOrganizationName(organization),
        ]),
      ),
    [organizations],
  );
  const currentPageSummary = useMemo(() => buildServiceSummary(page.data), [page.data]);

  async function loadMovementServices(
    nextPage = currentPage,
    nextStatus: MovementServiceStatus | '' = status,
    nextBillableFilter: 'any' | 'true' | 'false' = billableFilter,
  ) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listMovementServices({
        page: nextPage,
        pageSize: 10,
        status: nextStatus || undefined,
        isBillable: nextBillableFilter === 'any' ? undefined : nextBillableFilter === 'true',
        sortBy: 'requestedAt',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load movement services.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [movementResult, serviceResult, organizationResult, movementServiceResult] =
          await Promise.all([
            listMovements({ page: 1, pageSize: 100, sortBy: 'plannedAt', sortDirection: 'asc' }),
            listServices({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
            listOrganizations({ page: 1, pageSize: 100, status: 'active' }),
            listMovementServices({
              page: 1,
              pageSize: 10,
              sortBy: 'requestedAt',
              sortDirection: 'asc',
            }),
          ]);

        setMovements(movementResult.data);
        setServices(serviceResult.data);
        setOrganizations(organizationResult.data);
        setPage(movementServiceResult);
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load movement services.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitMovementService(input: CreateMovementServiceInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingMovementService) {
        await updateMovementService(editingMovementService.id, input);
      } else {
        await createMovementService(input);
      }
      setIsEditorOpen(false);
      setEditingMovementService(undefined);
      await loadMovementServices(1);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to save movement service.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeMovementService(movementService: MovementServiceRecord) {
    if (
      !window.confirm(
        `Cancel movement service for movement ${movementService.movementId}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteMovementService(movementService.id);
      await loadMovementServices(currentPage);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to cancel movement service.',
      );
    }
  }

  function openCreatePanel() {
    setEditingMovementService(undefined);
    setIsEditorOpen(true);
  }

  function openEditPanel(movementService: MovementServiceRecord) {
    setEditingMovementService(movementService);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingMovementService(undefined);
  }

  function handleMovementServiceRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    movementService: MovementServiceRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditPanel(movementService);
    }
  }

  function applySavedView(
    nextStatus: MovementServiceStatus | '',
    nextBillableFilter: 'any' | 'true' | 'false',
  ) {
    setStatus(nextStatus);
    setBillableFilter(nextBillableFilter);
    void loadMovementServices(1, nextStatus, nextBillableFilter);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Billing enablement"
          title="Movement Services"
          description="Attach performed marine services to movements so billing events can later be reviewed and exported to ERP systems."
          metadata={
            <div className="flex flex-wrap gap-2 text-xs text-steel">
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                {page.meta.totalItems} total services
              </span>
              <span className="rounded-full border border-line bg-panel px-2.5 py-1">
                Sorted by requested time
              </span>
            </div>
          }
          actions={
            <button
              type="button"
              onClick={openCreatePanel}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-panel"
            >
              Attach service
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
            detail="Ready for billing flow"
          />
          <KpiCard
            label="Completed"
            value={String(currentPageSummary.completed)}
            detail="Operationally done"
          />
          <KpiCard
            label="On hold"
            value={String(currentPageSummary.onHold)}
            detail="Needs review"
          />
        </section>

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Service board</h2>
                <p className="mt-1 text-sm text-steel">
                  Track requested, scheduled, completed, and billable services attached to movement
                  milestones.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedViews.map((view) => (
                  <button
                    key={view.label}
                    type="button"
                    onClick={() => applySavedView(view.status, view.billableFilter)}
                    className={
                      status === view.status && billableFilter === view.billableFilter
                        ? 'rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white'
                        : 'rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-steel'
                    }
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_10rem_auto]">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MovementServiceStatus | '')}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {movementServiceStatuses.map((option) => (
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
                onClick={() => void loadMovementServices(1)}
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
                    <th className="px-5 py-3 pr-4">Movement</th>
                    <th className="py-3 pr-4">Service</th>
                    <th className="py-3 pr-4">Commercial parties</th>
                    <th className="py-3 pr-4">Quantity</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Billable</th>
                    <th className="py-3 pr-4">Completed</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((movementService) => (
                    <tr
                      key={movementService.id}
                      tabIndex={0}
                      onClick={() => openEditPanel(movementService)}
                      onKeyDown={(event) => handleMovementServiceRowKeyDown(event, movementService)}
                      className="cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30"
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        <span className="font-semibold text-ink">
                          {movementLabels.get(movementService.movementId) ??
                            movementService.movementId}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {serviceLabels.get(movementService.serviceId) ?? movementService.serviceId}
                      </td>
                      <td className="py-3 pr-4 text-xs leading-5 text-steel">
                        <PartyLine
                          label="Provider"
                          organizationId={movementService.providerOrganizationId}
                          organizationLabels={organizationLabels}
                        />
                        <PartyLine
                          label="Receiver"
                          organizationId={movementService.serviceReceiverOrganizationId}
                          organizationLabels={organizationLabels}
                        />
                        <PartyLine
                          label="Bill to"
                          organizationId={movementService.billToOrganizationId}
                          organizationLabels={organizationLabels}
                        />
                        <PartyLine
                          label="Payer"
                          organizationId={movementService.payerOrganizationId}
                          organizationLabels={organizationLabels}
                        />
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {movementService.quantity} {movementService.unitOfMeasure}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={movementService.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-semibold text-steel">
                          {movementService.isBillable ? 'Billable' : 'Non-billable'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {formatDateTime(movementService.completedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditPanel(movementService);
                            }}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeMovementService(movementService);
                            }}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700"
                          >
                            Cancel
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
                  title="No movement services match this view"
                  description="Adjust the filters or attach a service to a movement so the work can be scheduled, completed, and made available for billing."
                />
              </div>
            ) : null}
            {isLoading ? (
              <p className="py-8 text-center text-sm text-steel">Loading movement services...</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-steel">
            <span>
              Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} movement
              services
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => void loadMovementServices(currentPage - 1)}
                className="rounded-md border border-line px-3 py-1.5 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= page.meta.totalPages}
                onClick={() => void loadMovementServices(currentPage + 1)}
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
        title={editingMovementService ? 'Edit movement service' : 'Attach service'}
        description="Attach or update marine services performed against a movement so billing and ERP export events have a trusted operational source."
        onClose={closeEditor}
      >
        <MovementServiceForm
          key={editingMovementService?.id ?? 'new-movement-service'}
          movementService={editingMovementService}
          movements={movements}
          services={services}
          organizations={organizations}
          isSubmitting={isSubmitting}
          onSubmit={submitMovementService}
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

function buildServiceSummary(items: readonly MovementServiceRecord[]) {
  return {
    billable: items.filter((item) => item.isBillable).length,
    completed: items.filter((item) => item.status === 'completed').length,
    onHold: items.filter((item) => item.status === 'on_hold').length,
  };
}

function PartyLine({
  label,
  organizationId,
  organizationLabels,
}: Readonly<{
  label: string;
  organizationId: string | null;
  organizationLabels: ReadonlyMap<string, string>;
}>) {
  return (
    <p>
      <span className="font-semibold text-ink">{label}: </span>
      {organizationId ? (organizationLabels.get(organizationId) ?? organizationId) : 'Not set'}
    </p>
  );
}

function formatOrganizationName(organization: OrganizationRecord): string {
  return organization.tradingName
    ? `${organization.tradingName} · ${organization.legalName}`
    : organization.legalName;
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
