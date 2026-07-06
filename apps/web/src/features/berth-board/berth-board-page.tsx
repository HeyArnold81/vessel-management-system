'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type {
  BerthRecord,
  MovementRecord,
  PortRecord,
  VesselCallRecord,
  VesselRecord,
} from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { listBerths } from '@/features/berths/api';
import { listMovements } from '@/features/movements/api';
import { listPorts } from '@/features/ports/api';
import { listVesselCalls } from '@/features/vessel-calls/api';
import { listVessels } from '@/features/vessels/api';
import { ApiClientError } from '@/lib/api/http';

type BoardLane = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly calls: readonly VesselCallRecord[];
};

type BoardWindow = {
  readonly start: number;
  readonly end: number;
};

const activeCallStatuses = ['planned', 'expected', 'arrived', 'alongside'] as const;
const activeMovementStatuses = ['planned', 'scheduled', 'in_progress'] as const;

export function BerthBoardPage() {
  const [berths, setBerths] = useState<readonly BerthRecord[]>([]);
  const [vesselCalls, setVesselCalls] = useState<readonly VesselCallRecord[]>([]);
  const [movements, setMovements] = useState<readonly MovementRecord[]>([]);
  const [ports, setPorts] = useState<readonly PortRecord[]>([]);
  const [vessels, setVessels] = useState<readonly VesselRecord[]>([]);
  const [selectedPortId, setSelectedPortId] = useState('');
  const [selectedTerminalId, setSelectedTerminalId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBoard() {
      setIsLoading(true);
      setError(null);

      try {
        const [berthResult, callResult, movementResult, portResult, vesselResult] =
          await Promise.all([
            listBerths({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
            listVesselCalls({ page: 1, pageSize: 100, sortBy: 'eta', sortDirection: 'asc' }),
            listMovements({ page: 1, pageSize: 100, sortBy: 'plannedAt', sortDirection: 'asc' }),
            listPorts({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
            listVessels({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          ]);

        setBerths(berthResult.data);
        setVesselCalls(callResult.data.filter((call) => isActiveCall(call.status)));
        setMovements(movementResult.data.filter((movement) => isActiveMovement(movement.status)));
        setPorts(portResult.data);
        setVessels(vesselResult.data);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load berth board.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadBoard();
  }, []);

  const vesselNames = useMemo(
    () => new Map(vessels.map((vessel) => [vessel.id, vessel.name])),
    [vessels],
  );
  const terminalOptions = useMemo(() => getTerminalOptions(berths), [berths]);
  const filteredBerths = useMemo(
    () =>
      selectedTerminalId
        ? berths.filter((berth) => berth.terminalId === selectedTerminalId)
        : berths,
    [berths, selectedTerminalId],
  );
  const filteredBerthIds = useMemo(
    () => new Set(filteredBerths.map((berth) => berth.id)),
    [filteredBerths],
  );
  const filteredCalls = useMemo(
    () =>
      vesselCalls.filter((call) => {
        if (selectedPortId && call.portId !== selectedPortId) {
          return false;
        }

        if (selectedTerminalId && call.berthId && !filteredBerthIds.has(call.berthId)) {
          return false;
        }

        return true;
      }),
    [filteredBerthIds, selectedPortId, selectedTerminalId, vesselCalls],
  );
  const filteredCallIds = useMemo(
    () => new Set(filteredCalls.map((call) => call.id)),
    [filteredCalls],
  );
  const filteredMovements = useMemo(
    () => movements.filter((movement) => filteredCallIds.has(movement.vesselCallId)),
    [filteredCallIds, movements],
  );
  const movementsByCall = useMemo(
    () => groupMovementsByCall(filteredMovements),
    [filteredMovements],
  );
  const conflictCallIds = useMemo(() => findConflictCallIds(filteredCalls), [filteredCalls]);
  const lanes = useMemo(
    () => buildBoardLanes(filteredBerths, filteredCalls),
    [filteredBerths, filteredCalls],
  );
  const unassignedCalls = useMemo(
    () => filteredCalls.filter((call) => !call.berthId || !filteredBerthIds.has(call.berthId)),
    [filteredBerthIds, filteredCalls],
  );
  const boardWindow = useMemo(() => getBoardWindow(filteredCalls), [filteredCalls]);

  const assignedCallCount = filteredCalls.length - unassignedCalls.length;
  const hasFilters = Boolean(selectedPortId || selectedTerminalId);

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Operations workspace"
          title="Berth Board"
          description="See active vessel calls by berth, spot allocation gaps, and jump straight into the operational chain for each call."
          actions={
            <Link
              href="/vessel-calls"
              className="inline-flex items-center rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-harbor"
            >
              Open vessel calls
            </Link>
          }
          metadata={
            <div className="flex flex-wrap gap-2 text-xs font-medium text-steel">
              <span className="rounded-full border border-line bg-panel px-3 py-1">
                {filteredCalls.length} active calls
              </span>
              <span className="rounded-full border border-line bg-panel px-3 py-1">
                {filteredBerths.length} active berths
              </span>
              <span className="rounded-full border border-line bg-panel px-3 py-1">
                Live operations view
              </span>
            </div>
          }
        />

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Board KPIs">
          <BoardMetric
            label="Assigned calls"
            value={assignedCallCount}
            detail="Linked to a berth"
          />
          <BoardMetric
            label="Unassigned calls"
            value={unassignedCalls.length}
            detail="Need planning"
            tone={unassignedCalls.length > 0 ? 'attention' : 'normal'}
          />
          <BoardMetric
            label="Active movements"
            value={filteredMovements.length}
            detail="Planned or running"
          />
          <BoardMetric
            label="Overlap risks"
            value={conflictCallIds.size}
            detail={conflictCallIds.size > 0 ? 'Review berth timings' : 'No overlaps found'}
            tone={conflictCallIds.size > 0 ? 'attention' : 'normal'}
          />
        </section>

        <section className="mb-6 rounded-lg border border-line bg-panel p-4 shadow-panel">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-ink">Planning filters</h2>
              <p className="mt-1 text-sm text-steel">
                Narrow the board by port or terminal while keeping unassigned calls visible for
                planning.
              </p>
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedPortId('');
                  setSelectedTerminalId('');
                }}
                className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-panel focus:outline-none focus:ring-2 focus:ring-harbor"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-ink">
              Port
              <select
                value={selectedPortId}
                onChange={(event) => setSelectedPortId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-harbor"
              >
                <option value="">All ports</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-ink">
              Terminal
              <select
                value={selectedTerminalId}
                onChange={(event) => setSelectedTerminalId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-harbor"
              >
                <option value="">All terminals</option>
                {terminalOptions.map((terminal) => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {unassignedCalls.length > 0 ? (
          <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50/70 p-4 shadow-panel dark:bg-amber-950/20">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Unassigned planning queue</h2>
                <p className="mt-1 text-sm text-steel">
                  These active calls need a berth allocation or a master data check.
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800">
                {unassignedCalls.length} to plan
              </span>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {unassignedCalls.map((call) => (
                <VesselCallCard
                  key={call.id}
                  call={call}
                  vesselName={vesselNames.get(call.vesselId) ?? 'Unknown vessel'}
                  movements={movementsByCall.get(call.id) ?? []}
                  hasConflict={false}
                />
              ))}
            </div>
          </section>
        ) : null}

        {conflictCallIds.size > 0 ? (
          <section className="mb-6 rounded-lg border border-amber-200 bg-panel p-4 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Berth conflict review</h2>
            <p className="mt-1 text-sm text-steel">
              {conflictCallIds.size} calls have overlapping berth windows. Review ETA and ETD before
              confirming the plan.
            </p>
          </section>
        ) : null}

        <section className="rounded-lg border border-line bg-panel shadow-panel">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Operational berth allocation</h2>
              <p className="mt-1 text-sm text-steel">
                Each vessel card opens the full call, movement, service, and audit workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-steel">
              <LegendDot label="Normal" className="bg-harbor" />
              <LegendDot label="Overlap risk" className="bg-amber-500" />
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <EmptyState
                title="Loading berth board"
                description="Gathering live vessel calls, berth allocations, and active movement events."
              />
            ) : lanes.length === 0 ? (
              <EmptyState
                title="No active berth activity"
                description="Create or schedule vessel calls to start building the operational berth board."
                action={
                  <Link
                    href="/vessel-calls"
                    className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white"
                  >
                    Go to vessel calls
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {lanes.map((lane) => (
                  <BerthLane
                    key={lane.id}
                    lane={lane}
                    vesselNames={vesselNames}
                    movementsByCall={movementsByCall}
                    conflictCallIds={conflictCallIds}
                    boardWindow={boardWindow}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function BoardMetric({
  label,
  value,
  detail,
  tone = 'normal',
}: Readonly<{ label: string; value: number; detail: string; tone?: 'normal' | 'attention' }>) {
  return (
    <article className="rounded-md border border-line bg-panel p-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p
        className={clsx(
          'mt-3 text-3xl font-semibold',
          tone === 'attention' ? 'text-amber-700' : 'text-ink',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-steel">{detail}</p>
    </article>
  );
}

function BerthLane({
  lane,
  vesselNames,
  movementsByCall,
  conflictCallIds,
  boardWindow,
}: Readonly<{
  lane: BoardLane;
  vesselNames: ReadonlyMap<string, string>;
  movementsByCall: ReadonlyMap<string, readonly MovementRecord[]>;
  conflictCallIds: ReadonlySet<string>;
  boardWindow: BoardWindow;
}>) {
  const conflictedCalls = lane.calls.filter((call) => conflictCallIds.has(call.id)).length;

  return (
    <div className="grid gap-4 py-5 lg:grid-cols-[14rem_1fr]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-harbor" />
          <h3 className="truncate text-sm font-semibold text-ink">{lane.label}</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-steel">{lane.detail}</p>
        <p className="mt-2 text-xs font-medium text-steel">
          {lane.calls.length} active {lane.calls.length === 1 ? 'call' : 'calls'}
          {conflictedCalls > 0 ? ` · ${conflictedCalls} conflict risk` : ''}
        </p>
      </div>

      {lane.calls.length === 0 ? (
        <div className="rounded-md border border-dashed border-line bg-surface px-4 py-6 text-sm text-steel">
          No active calls allocated.
        </div>
      ) : (
        <div className="grid gap-3">
          <OccupancyStrip
            calls={lane.calls}
            conflictCallIds={conflictCallIds}
            boardWindow={boardWindow}
          />
          <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
            {lane.calls.map((call) => (
              <VesselCallCard
                key={call.id}
                call={call}
                vesselName={vesselNames.get(call.vesselId) ?? 'Unknown vessel'}
                movements={movementsByCall.get(call.id) ?? []}
                hasConflict={conflictCallIds.has(call.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OccupancyStrip({
  calls,
  conflictCallIds,
  boardWindow,
}: Readonly<{
  calls: readonly VesselCallRecord[];
  conflictCallIds: ReadonlySet<string>;
  boardWindow: BoardWindow;
}>) {
  const windowDuration = boardWindow.end - boardWindow.start;

  return (
    <div
      className="relative h-10 overflow-hidden rounded-md border border-line bg-surface"
      aria-label="Berth occupancy timeline"
    >
      <div className="absolute inset-x-0 top-0 flex justify-between px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-steel">
        <span>{formatDateTime(new Date(boardWindow.start).toISOString())}</span>
        <span>{formatDateTime(new Date(boardWindow.end).toISOString())}</span>
      </div>
      <div className="absolute inset-x-2 bottom-2 top-5 rounded-full bg-line">
        {calls.map((call) => {
          const eta = call.eta ? new Date(call.eta).getTime() : boardWindow.start;
          const etd = call.etd ? new Date(call.etd).getTime() : eta + 60 * 60 * 1000;
          const left = clamp(((eta - boardWindow.start) / windowDuration) * 100, 0, 98);
          const width = clamp(((etd - eta) / windowDuration) * 100, 2, 100 - left);

          return (
            <span
              key={call.id}
              title={call.callReference}
              className={clsx(
                'absolute top-0 h-full rounded-full',
                conflictCallIds.has(call.id) ? 'bg-amber-500' : 'bg-harbor',
              )}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function VesselCallCard({
  call,
  vesselName,
  movements,
  hasConflict,
}: Readonly<{
  call: VesselCallRecord;
  vesselName: string;
  movements: readonly MovementRecord[];
  hasConflict: boolean;
}>) {
  const nextMovement = movements[0];

  return (
    <Link
      href={`/vessel-calls?id=${encodeURIComponent(call.id)}`}
      className={clsx(
        'block rounded-md border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-harbor hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-harbor',
        hasConflict ? 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/20' : 'border-line',
      )}
      aria-label={`${call.callReference} operational chain`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{call.callReference}</p>
          <p className="mt-1 truncate text-sm text-steel">{vesselName}</p>
        </div>
        <StatusBadge status={call.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <DateField label="ETA" value={call.eta} />
        <DateField label="ETD" value={call.etd} />
      </dl>

      <div className="mt-4 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5 text-steel">
        {nextMovement ? (
          <>
            <span className="font-semibold text-ink">{toTitleCase(nextMovement.movementType)}</span>
            <span> · {formatDateTime(nextMovement.plannedAt ?? nextMovement.actualAt)}</span>
          </>
        ) : (
          'No movement events scheduled'
        )}
      </div>

      {hasConflict ? (
        <p className="mt-3 text-xs font-semibold text-amber-800">Overlap risk on this berth</p>
      ) : null}
    </Link>
  );
}

function DateField({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return (
    <div>
      <dt className="font-semibold uppercase tracking-wide text-steel">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{formatDateTime(value)}</dd>
    </div>
  );
}

function LegendDot({ label, className }: Readonly<{ label: string; className: string }>) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
      <span className={clsx('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  );
}

function buildBoardLanes(
  berths: readonly BerthRecord[],
  vesselCalls: readonly VesselCallRecord[],
): readonly BoardLane[] {
  const callsByBerth = new Map<string, VesselCallRecord[]>();

  vesselCalls.forEach((call) => {
    if (!call.berthId) {
      return;
    }

    const calls = callsByBerth.get(call.berthId) ?? [];
    calls.push(call);
    callsByBerth.set(call.berthId, calls);
  });

  const berthLanes = berths
    .map((berth) => ({
      id: berth.id,
      label: berth.name,
      detail: `${berth.code}${berth.maxLengthM ? ` · LOA ${berth.maxLengthM}m` : ''}${
        berth.maxDraftM ? ` · Draft ${berth.maxDraftM}m` : ''
      }`,
      calls: sortCalls(callsByBerth.get(berth.id) ?? []),
    }))
    .filter((lane) => lane.calls.length > 0 || vesselCalls.length > 0);

  return berthLanes;
}

function sortCalls(calls: readonly VesselCallRecord[]) {
  return [...calls].sort((left, right) => {
    const leftTime = left.eta ?? left.createdAt;
    const rightTime = right.eta ?? right.createdAt;

    return leftTime.localeCompare(rightTime);
  });
}

function groupMovementsByCall(movements: readonly MovementRecord[]) {
  const grouped = new Map<string, MovementRecord[]>();

  movements.forEach((movement) => {
    const callMovements = grouped.get(movement.vesselCallId) ?? [];
    callMovements.push(movement);
    grouped.set(movement.vesselCallId, callMovements);
  });

  grouped.forEach((callMovements) => {
    callMovements.sort((left, right) => {
      const leftTime = left.plannedAt ?? left.actualAt ?? left.createdAt;
      const rightTime = right.plannedAt ?? right.actualAt ?? right.createdAt;

      return leftTime.localeCompare(rightTime);
    });
  });

  return grouped;
}

function findConflictCallIds(vesselCalls: readonly VesselCallRecord[]) {
  const conflictCallIds = new Set<string>();
  const callsByBerth = new Map<string, VesselCallRecord[]>();

  vesselCalls.forEach((call) => {
    if (!call.berthId || !call.eta || !call.etd) {
      return;
    }

    const calls = callsByBerth.get(call.berthId) ?? [];
    calls.push(call);
    callsByBerth.set(call.berthId, calls);
  });

  callsByBerth.forEach((calls) => {
    const sortedCalls = sortCalls(calls);

    sortedCalls.forEach((call, index) => {
      const nextCall = sortedCalls[index + 1];

      if (!nextCall || !call.etd || !nextCall.eta) {
        return;
      }

      if (new Date(call.etd).getTime() > new Date(nextCall.eta).getTime()) {
        conflictCallIds.add(call.id);
        conflictCallIds.add(nextCall.id);
      }
    });
  });

  return conflictCallIds;
}

function isActiveCall(status: string) {
  return activeCallStatuses.includes(status as (typeof activeCallStatuses)[number]);
}

function isActiveMovement(status: string) {
  return activeMovementStatuses.includes(status as (typeof activeMovementStatuses)[number]);
}

function getTerminalOptions(berths: readonly BerthRecord[]) {
  return Array.from(new Set(berths.map((berth) => berth.terminalId)))
    .sort((left, right) => left.localeCompare(right))
    .map((terminalId, index) => ({
      id: terminalId,
      label: `Terminal ${index + 1}`,
    }));
}

function getBoardWindow(calls: readonly VesselCallRecord[]): BoardWindow {
  const timestamps = calls
    .flatMap((call) => [call.eta, call.etd])
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    const start = Date.now();
    return { start, end: start + 24 * 60 * 60 * 1000 };
  }

  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  const minimumDuration = 12 * 60 * 60 * 1000;

  return {
    start,
    end: Math.max(end, start + minimumDuration),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}
