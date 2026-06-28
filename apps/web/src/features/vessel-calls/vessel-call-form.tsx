'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type {
  CreateVesselCallInput,
  PortRecord,
  VesselCallRecord,
  VesselCallStatus,
  VesselRecord,
} from '@vms/shared';
import { vesselCallStatuses } from '@vms/shared';

type VesselCallFormProps = {
  readonly vesselCall?: VesselCallRecord;
  readonly vessels: readonly VesselRecord[];
  readonly ports: readonly PortRecord[];
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateVesselCallInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function VesselCallForm({
  vesselCall,
  vessels,
  ports,
  isSubmitting,
  onSubmit,
  onCancel,
}: VesselCallFormProps) {
  const initialValues = useMemo(
    () => ({
      callReference: vesselCall?.callReference ?? '',
      vesselId: vesselCall?.vesselId ?? vessels[0]?.id ?? '',
      portId: vesselCall?.portId ?? ports[0]?.id ?? '',
      berthId: vesselCall?.berthId ?? '',
      agentId: vesselCall?.agentId ?? '',
      operatorId: vesselCall?.operatorId ?? '',
      voyageNumber: vesselCall?.voyageNumber ?? '',
      status: vesselCall?.status ?? 'planned',
      eta: toInputDateTime(vesselCall?.eta),
      etd: toInputDateTime(vesselCall?.etd),
      ata: toInputDateTime(vesselCall?.ata),
      atd: toInputDateTime(vesselCall?.atd),
      remarks: vesselCall?.remarks ?? '',
    }),
    [ports, vesselCall, vessels],
  );
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      callReference: values.callReference.toUpperCase(),
      vesselId: values.vesselId,
      portId: values.portId,
      berthId: values.berthId || null,
      agentId: values.agentId || null,
      operatorId: values.operatorId || null,
      voyageNumber: values.voyageNumber || null,
      status: values.status,
      eta: toIsoString(values.eta),
      etd: toIsoString(values.etd),
      ata: toIsoString(values.ata),
      atd: toIsoString(values.atd),
      remarks: values.remarks || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Call reference">
          <input
            required
            minLength={3}
            value={values.callReference}
            onChange={(event) =>
              setValues({ ...values, callReference: event.target.value.toUpperCase() })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
          />
        </Field>

        <Field label="Voyage number">
          <input
            value={values.voyageNumber}
            onChange={(event) => setValues({ ...values, voyageNumber: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Vessel">
          <select
            required
            value={values.vesselId}
            onChange={(event) => setValues({ ...values, vesselId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select vessel</option>
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
            value={values.portId}
            onChange={(event) => setValues({ ...values, portId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select port</option>
            {ports.map((port) => (
              <option key={port.id} value={port.id}>
                {port.name} · {port.unlocode}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as VesselCallStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {vesselCallStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Berth ID">
          <input
            value={values.berthId}
            onChange={(event) => setValues({ ...values, berthId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="ETA">
          <input
            type="datetime-local"
            value={values.eta}
            onChange={(event) => setValues({ ...values, eta: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="ETD">
          <input
            type="datetime-local"
            value={values.etd}
            onChange={(event) => setValues({ ...values, etd: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="ATA">
          <input
            type="datetime-local"
            value={values.ata}
            onChange={(event) => setValues({ ...values, ata: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="ATD">
          <input
            type="datetime-local"
            value={values.atd}
            onChange={(event) => setValues({ ...values, atd: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Agent ID">
          <input
            value={values.agentId}
            onChange={(event) => setValues({ ...values, agentId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Operator ID">
          <input
            value={values.operatorId}
            onChange={(event) => setValues({ ...values, operatorId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <Field label="Remarks">
        <textarea
          value={values.remarks}
          onChange={(event) => setValues({ ...values, remarks: event.target.value })}
          className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </Field>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-steel"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting || vessels.length === 0 || ports.length === 0}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : vesselCall ? 'Update call' : 'Create call'}
        </button>
      </div>
    </form>
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

function toInputDateTime(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : '';
}

function toIsoString(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
