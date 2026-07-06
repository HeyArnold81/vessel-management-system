'use client';

import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import type {
  CreateMovementInput,
  CreateMovementServiceInput,
  CreateVesselCallInput,
  BerthRecord,
  MovementRecord,
  MovementServiceRecord,
  MovementServiceStatus,
  MovementStatus,
  OrganizationRecord,
  PaginatedResponse,
  PortRecord,
  ServiceCatalogRecord,
  VesselCallRecord,
  VesselCallStatus,
  VesselRecord,
} from '@vms/shared';
import { vesselCallStatuses } from '@vms/shared';

import { ActionMenu, ActionMenuItem } from '@/components/ui/action-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SlideOver } from '@/components/ui/slide-over';
import { StatusBadge } from '@/components/ui/status-badge';
import { AuditLogPanel } from '@/features/audit/audit-log-panel';
import { listBerths } from '@/features/berths/api';
import {
  createMovementService,
  deleteMovementService,
  listMovementServices,
  updateMovementService,
} from '@/features/movement-services/api';
import { MovementServiceForm } from '@/features/movement-services/movement-service-form';
import { createMovement, listMovements, updateMovement } from '@/features/movements/api';
import { MovementForm } from '@/features/movements/movement-form';
import { listOrganizations } from '@/features/organizations/api';
import { listPorts } from '@/features/ports/api';
import { listServices } from '@/features/services/api';
import { listVessels } from '@/features/vessels/api';
import { ApiClientError } from '@/lib/api/http';

import {
  createVesselCall,
  deleteVesselCall,
  getVesselCall,
  listVesselCalls,
  updateVesselCall,
} from './api';
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

type VesselCallsPageProps = {
  readonly initialId?: string;
  readonly initialSearch?: string;
};

export function VesselCallsPage({ initialId = '', initialSearch = '' }: VesselCallsPageProps) {
  const [page, setPage] = useState(initialPage);
  const [vessels, setVessels] = useState<readonly VesselRecord[]>([]);
  const [ports, setPorts] = useState<readonly PortRecord[]>([]);
  const [berths, setBerths] = useState<readonly BerthRecord[]>([]);
  const [services, setServices] = useState<readonly ServiceCatalogRecord[]>([]);
  const [organizations, setOrganizations] = useState<readonly OrganizationRecord[]>([]);
  const [selectedVesselCall, setSelectedVesselCall] = useState<VesselCallRecord | null>(null);
  const [linkedMovements, setLinkedMovements] = useState<readonly MovementRecord[]>([]);
  const [linkedMovementServices, setLinkedMovementServices] = useState<
    readonly MovementServiceRecord[]
  >([]);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<VesselCallStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMovementEditorOpen, setIsMovementEditorOpen] = useState(false);
  const [serviceMovement, setServiceMovement] = useState<MovementRecord | null>(null);
  const [editingMovementService, setEditingMovementService] = useState<
    MovementServiceRecord | undefined
  >();
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
  const berthNames = useMemo(
    () => new Map(berths.map((berth) => [berth.id, `${berth.name} (${berth.code})`])),
    [berths],
  );
  const serviceNames = useMemo(
    () => new Map(services.map((service) => [service.id, `${service.name} (${service.code})`])),
    [services],
  );
  const organizationNames = useMemo(
    () =>
      new Map(
        organizations.map((organization) => [
          organization.id,
          formatOrganizationName(organization),
        ]),
      ),
    [organizations],
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
      setSearch(initialSearch);

      try {
        const [
          vesselResult,
          portResult,
          berthResult,
          serviceResult,
          organizationResult,
          callResult,
        ] = await Promise.all([
          listVessels({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listPorts({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listBerths({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listServices({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listOrganizations({ page: 1, pageSize: 100, status: 'active' }),
          initialId
            ? getVesselCall(initialId)
            : listVesselCalls({
                page: 1,
                pageSize: 10,
                search: initialSearch,
                sortBy: 'eta',
                sortDirection: 'asc',
              }),
        ]);
        const nextPage =
          'meta' in callResult
            ? callResult
            : {
                data: [callResult],
                meta: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
              };

        setVessels(vesselResult.data);
        setPorts(portResult.data);
        setBerths(berthResult.data);
        setServices(serviceResult.data);
        setOrganizations(organizationResult.data);
        setPage(nextPage);
        if (!('meta' in callResult)) {
          await selectVesselCall(callResult);
        }
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load vessel calls.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, [initialId, initialSearch]);

  async function submitVesselCall(input: CreateVesselCallInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      let savedVesselCall: VesselCallRecord;

      if (editingVesselCall) {
        savedVesselCall = await updateVesselCall(editingVesselCall.id, input);
      } else {
        savedVesselCall = await createVesselCall(input);
      }
      setIsEditorOpen(false);
      setEditingVesselCall(undefined);
      if (selectedVesselCall?.id === savedVesselCall.id) {
        await selectVesselCall(savedVesselCall);
      }
      await loadVesselCalls(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save vessel call.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitMovement(input: CreateMovementInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createMovement(input);
      setIsMovementEditorOpen(false);
      if (selectedVesselCall) {
        await selectVesselCall(selectedVesselCall);
      }
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save movement.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitMovementService(input: CreateMovementServiceInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingMovementService) {
        await updateMovementService(editingMovementService.id, input);
      } else {
        await createMovementService(input);
      }
      closeServiceEditor();
      if (selectedVesselCall) {
        await selectVesselCall(selectedVesselCall);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to attach movement service.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeMovementService(movementService: MovementServiceRecord) {
    if (
      !window.confirm(
        `Delete movement service ${
          serviceNames.get(movementService.serviceId) ?? movementService.serviceId
        }? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteMovementService(movementService.id);
      if (selectedVesselCall) {
        await selectVesselCall(selectedVesselCall);
      }
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to delete movement service.',
      );
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
      if (selectedVesselCall?.id === vesselCall.id) {
        clearOperationalChain();
      }
      await loadVesselCalls(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to delete vessel call.');
    }
  }

  async function advanceVesselCallStatus(
    vesselCall: VesselCallRecord,
    nextStatus: VesselCallStatus,
  ) {
    setError(null);

    try {
      const updated = await updateVesselCall(vesselCall.id, { status: nextStatus });
      setPage((current) => ({
        ...current,
        data: current.data.map((item) => (item.id === updated.id ? updated : item)),
      }));
      await selectVesselCall(updated);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to update vessel call status.',
      );
    }
  }

  async function advanceMovementStatus(movement: MovementRecord, nextStatus: MovementStatus) {
    if (!selectedVesselCall) {
      return;
    }

    setError(null);

    try {
      await updateMovement(movement.id, { status: nextStatus });
      await selectVesselCall(selectedVesselCall);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to update movement.');
    }
  }

  async function advanceMovementServiceStatus(
    movementService: MovementServiceRecord,
    nextStatus: MovementServiceStatus,
  ) {
    if (!selectedVesselCall) {
      return;
    }

    setError(null);

    try {
      await updateMovementService(movementService.id, { status: nextStatus });
      await selectVesselCall(selectedVesselCall);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to update movement service.',
      );
    }
  }

  async function selectVesselCall(vesselCall: VesselCallRecord) {
    setSelectedVesselCall(vesselCall);
    setLinkedMovements([]);
    setLinkedMovementServices([]);
    setIsWorkflowLoading(true);
    setError(null);

    try {
      const movementResult = await listMovements({
        page: 1,
        pageSize: 100,
        vesselCallId: vesselCall.id,
        sortBy: 'plannedAt',
        sortDirection: 'asc',
      });
      const movementServices = await Promise.all(
        movementResult.data.map((movement) =>
          listMovementServices({
            page: 1,
            pageSize: 100,
            movementId: movement.id,
            sortBy: 'requestedAt',
            sortDirection: 'asc',
          }),
        ),
      );

      setLinkedMovements(movementResult.data);
      setLinkedMovementServices(movementServices.flatMap((result) => result.data));
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to load operational chain.',
      );
    } finally {
      setIsWorkflowLoading(false);
    }
  }

  function clearOperationalChain() {
    setSelectedVesselCall(null);
    setLinkedMovements([]);
    setLinkedMovementServices([]);
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

  function closeMovementEditor() {
    setIsMovementEditorOpen(false);
  }

  function closeServiceEditor() {
    setServiceMovement(null);
    setEditingMovementService(undefined);
  }

  function openCreateServicePanel(movement: MovementRecord) {
    setEditingMovementService(undefined);
    setServiceMovement(movement);
  }

  function openEditServicePanel(movementService: MovementServiceRecord) {
    setEditingMovementService(movementService);
    setServiceMovement(
      linkedMovements.find((movement) => movement.id === movementService.movementId) ?? null,
    );
  }

  function handleVesselCallRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    vesselCall: VesselCallRecord,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void selectVesselCall(vesselCall);
    }
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
          description="Control inbound, alongside, and outbound vessel visits before movements, services, cargo, and billing activity is attached."
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
                  Select a call to work its movement and service chain from the same workspace.
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
                    <tr
                      key={vesselCall.id}
                      tabIndex={0}
                      aria-selected={selectedVesselCall?.id === vesselCall.id}
                      onClick={() => void selectVesselCall(vesselCall)}
                      onKeyDown={(event) => handleVesselCallRowKeyDown(event, vesselCall)}
                      className={
                        selectedVesselCall?.id === vesselCall.id
                          ? 'cursor-pointer border-l-4 border-harbor bg-surface outline-none ring-1 ring-inset ring-harbor/30'
                          : 'cursor-pointer hover:bg-surface/70 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-inset focus:ring-harbor/30'
                      }
                    >
                      <td className="px-5 py-3 pr-4 font-semibold text-ink">
                        <span className="inline-flex items-center gap-2 font-semibold text-ink">
                          {vesselCall.callReference}
                          {selectedVesselCall?.id === vesselCall.id ? (
                            <span className="rounded-full bg-harbor/10 px-2 py-0.5 text-xs font-semibold text-harbor">
                              Selected
                            </span>
                          ) : null}
                        </span>
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
                        <ActionMenu>
                          <ActionMenuItem onClick={() => void selectVesselCall(vesselCall)}>
                            View operations
                          </ActionMenuItem>
                          <ActionMenuItem onClick={() => openEditPanel(vesselCall)}>
                            Edit call
                          </ActionMenuItem>
                          <ActionMenuItem
                            destructive
                            onClick={() => void removeVesselCall(vesselCall)}
                          >
                            Delete call
                          </ActionMenuItem>
                        </ActionMenu>
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
                  action={
                    <button
                      type="button"
                      onClick={openCreatePanel}
                      className="rounded-md bg-harbor px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      New vessel call
                    </button>
                  }
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

        <OperationalChain
          vesselCall={selectedVesselCall}
          movements={linkedMovements}
          movementServices={linkedMovementServices}
          serviceNames={serviceNames}
          organizationNames={organizationNames}
          berthName={
            selectedVesselCall?.berthId
              ? (berthNames.get(selectedVesselCall.berthId) ?? selectedVesselCall.berthId)
              : 'Not assigned'
          }
          vesselName={
            selectedVesselCall
              ? (vesselNames.get(selectedVesselCall.vesselId) ?? selectedVesselCall.vesselId)
              : ''
          }
          portName={
            selectedVesselCall
              ? (portNames.get(selectedVesselCall.portId) ?? selectedVesselCall.portId)
              : ''
          }
          isLoading={isWorkflowLoading}
          onAddMovement={() => setIsMovementEditorOpen(true)}
          onEditVesselCall={openEditPanel}
          onAttachService={openCreateServicePanel}
          onEditService={openEditServicePanel}
          onDeleteService={removeMovementService}
          onAdvanceVesselCallStatus={advanceVesselCallStatus}
          onAdvanceMovementStatus={advanceMovementStatus}
          onAdvanceMovementServiceStatus={advanceMovementServiceStatus}
        />

        {selectedVesselCall ? (
          <AuditLogPanel
            entityType="vessel_call"
            entityId={selectedVesselCall.id}
            title="Recent vessel call activity"
          />
        ) : null}
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

      <SlideOver
        isOpen={isMovementEditorOpen}
        title="Add movement"
        description="Create a movement directly under the selected vessel call."
        onClose={closeMovementEditor}
      >
        <MovementForm
          vesselCalls={selectedVesselCall ? [selectedVesselCall] : []}
          isSubmitting={isSubmitting}
          onSubmit={submitMovement}
          onCancel={closeMovementEditor}
        />
      </SlideOver>

      <SlideOver
        isOpen={serviceMovement !== null || editingMovementService !== undefined}
        title={editingMovementService ? 'Edit service' : 'Attach service'}
        description="Attach or update a marine service directly from this vessel call."
        onClose={closeServiceEditor}
      >
        <MovementServiceForm
          key={editingMovementService?.id ?? serviceMovement?.id ?? 'new-movement-service'}
          movementService={editingMovementService}
          movements={serviceMovement ? [serviceMovement] : linkedMovements}
          services={services}
          organizations={organizations}
          isSubmitting={isSubmitting}
          onSubmit={submitMovementService}
          onCancel={closeServiceEditor}
        />
      </SlideOver>
    </main>
  );
}

function OperationalChain({
  vesselCall,
  movements,
  movementServices,
  serviceNames,
  organizationNames,
  berthName,
  vesselName,
  portName,
  isLoading,
  onAddMovement,
  onEditVesselCall,
  onAttachService,
  onEditService,
  onDeleteService,
  onAdvanceVesselCallStatus,
  onAdvanceMovementStatus,
  onAdvanceMovementServiceStatus,
}: Readonly<{
  vesselCall: VesselCallRecord | null;
  movements: readonly MovementRecord[];
  movementServices: readonly MovementServiceRecord[];
  serviceNames: ReadonlyMap<string, string>;
  organizationNames: ReadonlyMap<string, string>;
  berthName: string;
  vesselName: string;
  portName: string;
  isLoading: boolean;
  onAddMovement: () => void;
  onEditVesselCall: (vesselCall: VesselCallRecord) => void;
  onAttachService: (movement: MovementRecord) => void;
  onEditService: (movementService: MovementServiceRecord) => void;
  onDeleteService: (movementService: MovementServiceRecord) => void;
  onAdvanceVesselCallStatus: (vesselCall: VesselCallRecord, nextStatus: VesselCallStatus) => void;
  onAdvanceMovementStatus: (movement: MovementRecord, nextStatus: MovementStatus) => void;
  onAdvanceMovementServiceStatus: (
    movementService: MovementServiceRecord,
    nextStatus: MovementServiceStatus,
  ) => void;
}>) {
  if (!vesselCall) {
    return (
      <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
        <EmptyState
          title="Select a vessel call to view the operational chain"
          description="Choose a call from the board to see its movements and the marine services attached to each movement."
        />
      </section>
    );
  }

  const vesselCallTransition = getVesselCallTransition(vesselCall.status);
  const readiness = getOperationalReadiness(vesselCall, movements, movementServices);
  const nextStep = getNextOperationalStep(vesselCall, movements, movementServices);
  const billableCompletedServices = movementServices.filter(
    (service) => service.isBillable && service.status === 'completed',
  ).length;
  const billablePendingServices = movementServices.filter(
    (service) => service.isBillable && service.status !== 'completed',
  ).length;
  const agentName = vesselCall.agentId
    ? (organizationNames.get(vesselCall.agentId) ?? vesselCall.agentId)
    : 'Not assigned';
  const operatorName = vesselCall.operatorId
    ? (organizationNames.get(vesselCall.operatorId) ?? vesselCall.operatorId)
    : 'Not assigned';

  return (
    <section className="rounded-lg border border-line bg-panel shadow-panel">
      <div className="border-b border-line px-5 py-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-harbor">
              Vessel call workspace
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-ink">{vesselCall.callReference}</h2>
              <StatusBadge status={vesselCall.status} />
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${readiness.className}`}
              >
                {readiness.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-steel">
              {vesselName} · {portName} · {berthName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {vesselCallTransition ? (
              <button
                type="button"
                onClick={() => onAdvanceVesselCallStatus(vesselCall, vesselCallTransition.status)}
                className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
              >
                {vesselCallTransition.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAddMovement}
              className="rounded-md bg-harbor px-3 py-1.5 text-sm font-semibold text-white"
            >
              Add movement
            </button>
            <button
              type="button"
              onClick={() => onEditVesselCall(vesselCall)}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
            >
              Edit call details
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-line bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Next action</p>
          <p className="mt-1 text-sm font-semibold text-ink">{nextStep.title}</p>
          <p className="mt-1 text-sm leading-6 text-steel">{nextStep.detail}</p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-line bg-surface/60 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        <OperationalSummaryItem label="Status" value={<StatusBadge status={vesselCall.status} />} />
        <OperationalSummaryItem label="Berth" value={berthName} />
        <OperationalSummaryItem label="ETA" value={formatDateTime(vesselCall.eta)} />
        <OperationalSummaryItem label="ETD" value={formatDateTime(vesselCall.etd)} />
        <OperationalSummaryItem label="ATA" value={formatDateTime(vesselCall.ata)} />
        <OperationalSummaryItem label="ATD" value={formatDateTime(vesselCall.atd)} />
        <OperationalSummaryItem
          label="Chain"
          value={`${movements.length} movements · ${movementServices.length} services`}
        />
        <OperationalSummaryItem
          label="Billing readiness"
          value={`${billableCompletedServices} ready · ${billablePendingServices} pending`}
        />
      </div>

      <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-3">
        <OperationalSummaryItem label="Agent" value={agentName} />
        <OperationalSummaryItem label="Operator" value={operatorName} />
        <OperationalSummaryItem
          label="Voyage"
          value={vesselCall.voyageNumber ? vesselCall.voyageNumber : 'Not set'}
        />
      </div>

      {isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-steel">Loading operational chain...</p>
      ) : null}

      {!isLoading && movements.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No movements linked to this vessel call"
            description="Create a movement for this call before attaching pilotage, towage, mooring, cargo, or billing services."
            action={
              <button
                type="button"
                onClick={onAddMovement}
                className="rounded-md bg-harbor px-3 py-1.5 text-sm font-semibold text-white"
              >
                Add movement
              </button>
            }
          />
        </div>
      ) : null}

      {!isLoading && movements.length > 0 ? (
        <div className="divide-y divide-line">
          {movements.map((movement) => {
            const servicesForMovement = movementServices.filter(
              (movementService) => movementService.movementId === movement.id,
            );
            const movementTransition = getMovementTransition(movement.status);

            return (
              <article key={movement.id} className="grid gap-4 px-5 py-5 xl:grid-cols-[18rem_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{movement.movementReference}</h3>
                    <StatusBadge status={movement.status} />
                  </div>
                  <p className="mt-2 text-sm text-steel">{movement.movementType}</p>
                  <p className="mt-1 text-sm text-steel">
                    Planned {formatDateTime(movement.plannedAt)}
                  </p>
                  {movementTransition ? (
                    <button
                      type="button"
                      onClick={() => onAdvanceMovementStatus(movement, movementTransition.status)}
                      className="mt-3 rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
                    >
                      {movementTransition.label}
                    </button>
                  ) : null}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-steel">
                      Movement services
                    </p>
                    <button
                      type="button"
                      onClick={() => onAttachService(movement)}
                      className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-steel"
                    >
                      Attach service
                    </button>
                  </div>
                  {servicesForMovement.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {servicesForMovement.map((movementService) => {
                        const serviceTransition = getMovementServiceTransition(
                          movementService.status,
                        );

                        return (
                          <div
                            key={movementService.id}
                            className="rounded-md border border-line bg-surface p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {serviceNames.get(movementService.serviceId) ??
                                  movementService.serviceId}
                              </p>
                              <StatusBadge status={movementService.status} />
                            </div>
                            <p className="mt-2 text-sm text-steel">
                              {movementService.quantity} {movementService.unitOfMeasure}
                            </p>
                            <p className="mt-1 text-xs text-steel">
                              {movementService.isBillable ? 'Billable' : 'Non-billable'}
                            </p>
                            <div className="mt-2 space-y-0.5 text-xs text-steel">
                              <PartyLine
                                label="Provider"
                                organizationId={movementService.providerOrganizationId}
                                organizationNames={organizationNames}
                              />
                              <PartyLine
                                label="Receiver"
                                organizationId={movementService.serviceReceiverOrganizationId}
                                organizationNames={organizationNames}
                              />
                              <PartyLine
                                label="Bill to"
                                organizationId={movementService.billToOrganizationId}
                                organizationNames={organizationNames}
                              />
                              <PartyLine
                                label="Payer"
                                organizationId={movementService.payerOrganizationId}
                                organizationNames={organizationNames}
                              />
                            </div>
                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                              {serviceTransition ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAdvanceMovementServiceStatus(
                                      movementService,
                                      serviceTransition.status,
                                    )
                                  }
                                  className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-steel"
                                >
                                  {serviceTransition.label}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => onEditService(movementService)}
                                className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-steel"
                              >
                                Edit service
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteService(movementService)}
                                className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700"
                              >
                                Delete service
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-md border border-dashed border-line bg-surface px-4 py-5 text-sm text-steel">
                      No services attached to this movement yet.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
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

function OperationalSummaryItem({ label, value }: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function PartyLine({
  label,
  organizationId,
  organizationNames,
}: Readonly<{
  label: string;
  organizationId: string | null;
  organizationNames: ReadonlyMap<string, string>;
}>) {
  return (
    <p>
      <span className="font-semibold text-ink">{label}: </span>
      {organizationId ? (organizationNames.get(organizationId) ?? organizationId) : 'Not set'}
    </p>
  );
}

function formatOrganizationName(organization: OrganizationRecord): string {
  return organization.tradingName
    ? `${organization.tradingName} · ${organization.legalName}`
    : organization.legalName;
}

function buildVesselCallSummary(items: readonly VesselCallRecord[]) {
  return {
    expected: items.filter((item) => item.status === 'expected').length,
    alongside: items.filter((item) => item.status === 'alongside').length,
    departed: items.filter((item) => item.status === 'departed').length,
  };
}

function getVesselCallTransition(
  status: VesselCallStatus,
): { label: string; status: VesselCallStatus } | null {
  switch (status) {
    case 'planned':
      return { label: 'Mark expected', status: 'expected' };
    case 'expected':
      return { label: 'Mark arrived', status: 'arrived' };
    case 'arrived':
      return { label: 'Mark alongside', status: 'alongside' };
    case 'alongside':
      return { label: 'Mark departed', status: 'departed' };
    default:
      return null;
  }
}

function getMovementTransition(
  status: MovementStatus,
): { label: string; status: MovementStatus } | null {
  switch (status) {
    case 'planned':
      return { label: 'Start movement', status: 'in_progress' };
    case 'in_progress':
      return { label: 'Complete movement', status: 'completed' };
    default:
      return null;
  }
}

function getMovementServiceTransition(
  status: MovementServiceStatus,
): { label: string; status: MovementServiceStatus } | null {
  switch (status) {
    case 'requested':
      return { label: 'Schedule service', status: 'scheduled' };
    case 'scheduled':
      return { label: 'Start service', status: 'in_progress' };
    case 'in_progress':
      return { label: 'Complete service', status: 'completed' };
    case 'on_hold':
      return { label: 'Resume service', status: 'scheduled' };
    default:
      return null;
  }
}

function getOperationalReadiness(
  vesselCall: VesselCallRecord,
  movements: readonly MovementRecord[],
  movementServices: readonly MovementServiceRecord[],
) {
  if (!vesselCall.berthId) {
    return {
      label: 'Berth required',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  if (movements.length === 0) {
    return {
      label: 'Movement required',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  const hasOpenServices = movementServices.some((service) =>
    ['requested', 'scheduled', 'in_progress', 'on_hold'].includes(service.status),
  );

  if (hasOpenServices) {
    return {
      label: 'Services active',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    };
  }

  if (vesselCall.status === 'departed') {
    return {
      label: 'Visit complete',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: 'Operationally ready',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
}

function getNextOperationalStep(
  vesselCall: VesselCallRecord,
  movements: readonly MovementRecord[],
  movementServices: readonly MovementServiceRecord[],
) {
  if (!vesselCall.berthId) {
    return {
      title: 'Assign a berth',
      detail: 'This call is visible in the Berth Board planning queue until a berth is selected.',
    };
  }

  if (movements.length === 0) {
    return {
      title: 'Create the first movement',
      detail:
        'Add an arrival, departure, berth shift, pilotage, or towage movement to start the operational chain.',
    };
  }

  const nextMovement = movements.find((movement) => movement.status !== 'completed');

  if (nextMovement) {
    return {
      title: `Progress ${nextMovement.movementReference}`,
      detail: `The next movement is ${nextMovement.movementType.replaceAll('_', ' ')} planned for ${formatDateTime(nextMovement.plannedAt)}.`,
    };
  }

  const openBillableServices = movementServices.filter(
    (service) => service.isBillable && service.status !== 'completed',
  );

  if (openBillableServices.length > 0) {
    return {
      title: 'Complete billable services',
      detail: `${openBillableServices.length} billable services still need completion before billing is ready.`,
    };
  }

  if (vesselCall.status !== 'departed') {
    return {
      title: 'Close out the vessel call',
      detail: 'Movements are complete. Confirm departure status when the vessel has sailed.',
    };
  }

  return {
    title: 'Review audit and billing handoff',
    detail:
      'The operational visit is complete. Review audit history and billing readiness before export.',
  };
}

function formatDateTime(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '-';
}
