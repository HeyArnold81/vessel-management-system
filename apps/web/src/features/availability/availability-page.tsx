'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { AvailabilityCheckRecord, BerthRecord, PortRecord, VesselRecord } from '@vms/shared';

import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { listBerths } from '@/features/berths/api';
import { createBookingRequest } from '@/features/booking-requests/api';
import { listPorts } from '@/features/ports/api';
import { listVessels } from '@/features/vessels/api';
import { ApiClientError } from '@/lib/api/http';

import { checkAvailability } from './api';

export function AvailabilityPage() {
  const [vessels, setVessels] = useState<readonly VesselRecord[]>([]);
  const [ports, setPorts] = useState<readonly PortRecord[]>([]);
  const [berths, setBerths] = useState<readonly BerthRecord[]>([]);
  const [vesselId, setVesselId] = useState('');
  const [portId, setPortId] = useState('');
  const [preferredBerthId, setPreferredBerthId] = useState('');
  const [requestedEta, setRequestedEta] = useState('');
  const [requestedEtd, setRequestedEtd] = useState('');
  const [result, setResult] = useState<AvailabilityCheckRecord | null>(null);
  const [createdBookingRequestId, setCreatedBookingRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true);
      setError(null);

      try {
        const [vesselResult, portResult, berthResult] = await Promise.all([
          listVessels({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listPorts({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
          listBerths({ page: 1, pageSize: 100, status: 'active', sortBy: 'name' }),
        ]);

        setVessels(vesselResult.data);
        setPorts(portResult.data);
        setBerths(berthResult.data);
        setVesselId(vesselResult.data[0]?.id ?? '');
        setPortId(portResult.data[0]?.id ?? '');
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load availability data.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOptions();
  }, []);

  const berthOptions = useMemo(() => berths, [berths]);

  async function submitCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsChecking(true);
    setError(null);
    setResult(null);
    setCreatedBookingRequestId(null);

    try {
      setResult(
        await checkAvailability({
          vesselId,
          portId,
          preferredBerthId: preferredBerthId || null,
          requestedEta: toIsoString(requestedEta),
          requestedEtd: toIsoString(requestedEtd),
        }),
      );
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to check availability.');
    } finally {
      setIsChecking(false);
    }
  }

  async function createBookingFromResult() {
    if (!result) {
      return;
    }

    setIsCreatingBooking(true);
    setError(null);

    try {
      const bookingRequest = await createBookingRequest({
        requestReference: buildBookingRequestReference(),
        vesselId,
        portId,
        preferredBerthId: preferredBerthId || null,
        requestedEta: result.requestedEta,
        requestedEtd: result.requestedEtd,
        remarks: `Created from advisory availability check ${result.id}. Result: ${result.result}.`,
      });

      setCreatedBookingRequestId(bookingRequest.id);
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : 'Unable to create booking request from availability result.',
      );
    } finally {
      setIsCreatingBooking(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Customer intake"
          title="Availability"
          description="Run an advisory berth and service availability check before creating or reviewing a booking request."
          actions={
            <Link
              href="/booking-requests"
              className="rounded-md border border-line bg-panel px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              View booking requests
            </Link>
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

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1fr]">
          <form
            onSubmit={submitCheck}
            className="grid content-start gap-4 rounded-lg border border-line bg-panel p-5 shadow-panel"
          >
            <h2 className="text-lg font-semibold text-ink">Check requested visit window</h2>
            <Field label="Vessel">
              <select
                required
                value={vesselId}
                onChange={(event) => setVesselId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name} · {vessel.imoNumber}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Port">
              <select
                required
                value={portId}
                onChange={(event) => setPortId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.name} · {port.unlocode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred berth">
              <select
                value={preferredBerthId}
                onChange={(event) => setPreferredBerthId(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              >
                <option value="">Any suitable berth</option>
                {berthOptions.map((berth) => (
                  <option key={berth.id} value={berth.id}>
                    {berth.name} · {berth.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Requested ETA">
              <input
                required
                type="datetime-local"
                value={requestedEta}
                onChange={(event) => setRequestedEta(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </Field>
            <Field label="Requested ETD">
              <input
                required
                type="datetime-local"
                value={requestedEtd}
                onChange={(event) => setRequestedEtd(event.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
              />
            </Field>
            <button
              type="submit"
              disabled={isLoading || isChecking || !vesselId || !portId}
              className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChecking ? 'Checking...' : 'Check availability'}
            </button>
          </form>

          <section className="rounded-lg border border-line bg-panel p-5 shadow-panel">
            {result ? (
              <AvailabilityResultPanel
                result={result}
                createdBookingRequestId={createdBookingRequestId}
                isCreatingBooking={isCreatingBooking}
                onCreateBooking={createBookingFromResult}
              />
            ) : (
              <EmptyState
                title="No availability check yet"
                description="Enter the requested vessel, port, berth preference, and visit window to produce an advisory review."
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function AvailabilityResultPanel({
  result,
  createdBookingRequestId,
  isCreatingBooking,
  onCreateBooking,
}: Readonly<{
  result: AvailabilityCheckRecord;
  createdBookingRequestId: string | null;
  isCreatingBooking: boolean;
  onCreateBooking: () => void;
}>) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Availability result</h2>
          <p className="mt-1 text-sm leading-6 text-steel">{result.summary}</p>
        </div>
        <StatusBadge status={result.result} />
      </div>
      <div className="mt-5 grid gap-3">
        {Object.entries(result.checks).map(([key, check]) => (
          <div key={key} className="rounded-md border border-line bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold capitalize text-ink">
                {key.replace(/([A-Z])/g, ' $1')}
              </p>
              <StatusBadge status={check.status} />
            </div>
            <p className="mt-2 text-sm text-steel">{check.message}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        Availability is advisory and must be reviewed by port operations before approval.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
        <div>
          <p className="text-sm font-semibold text-ink">Next step</p>
          <p className="mt-1 text-sm text-steel">
            Create a booking request so port operations can review and progress this enquiry.
          </p>
        </div>
        {createdBookingRequestId ? (
          <Link
            href="/booking-requests"
            className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white"
          >
            View booking queue
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCreateBooking}
            disabled={isCreatingBooking}
            className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingBooking ? 'Creating...' : 'Create booking request'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="grid gap-1 text-sm font-medium text-ink">
      <span>{label}</span>
      {children}
    </label>
  );
}

function toIsoString(value: string): string {
  return new Date(value).toISOString();
}

function buildBookingRequestReference(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);

  return `BR-${year}-${suffix}`;
}
