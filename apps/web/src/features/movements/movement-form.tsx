'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type {
  CreateMovementInput,
  MovementRecord,
  MovementStatus,
  MovementType,
  VesselCallRecord,
} from '@vms/shared';
import { movementStatuses, movementTypes } from '@vms/shared';

type MovementFormProps = {
  readonly movement?: MovementRecord;
  readonly vesselCalls: readonly VesselCallRecord[];
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateMovementInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function MovementForm({
  movement,
  vesselCalls,
  isSubmitting,
  onSubmit,
  onCancel,
}: MovementFormProps) {
  const initialValues = useMemo(
    () => ({
      movementReference: movement?.movementReference ?? '',
      vesselCallId: movement?.vesselCallId ?? vesselCalls[0]?.id ?? '',
      fromBerthId: movement?.fromBerthId ?? '',
      toBerthId: movement?.toBerthId ?? '',
      movementType: movement?.movementType ?? 'arrival',
      status: movement?.status ?? 'planned',
      plannedAt: toInputDateTime(movement?.plannedAt),
      actualAt: toInputDateTime(movement?.actualAt),
      remarks: movement?.remarks ?? '',
    }),
    [movement, vesselCalls],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const selectedCall = vesselCalls.find((vesselCall) => vesselCall.id === values.vesselCallId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCall) {
      return;
    }

    await onSubmit({
      movementReference: values.movementReference.toUpperCase(),
      vesselCallId: selectedCall.id,
      vesselId: selectedCall.vesselId,
      portId: selectedCall.portId,
      fromBerthId: values.fromBerthId || null,
      toBerthId: values.toBerthId || null,
      movementType: values.movementType,
      status: values.status,
      plannedAt: toIsoString(values.plannedAt),
      actualAt: toIsoString(values.actualAt),
      remarks: values.remarks || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Movement reference">
          <input
            required
            minLength={3}
            value={values.movementReference}
            onChange={(event) =>
              setValues({ ...values, movementReference: event.target.value.toUpperCase() })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
          />
        </Field>

        <Field label="Vessel call">
          <select
            required
            value={values.vesselCallId}
            onChange={(event) => setValues({ ...values, vesselCallId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select call</option>
            {vesselCalls.map((vesselCall) => (
              <option key={vesselCall.id} value={vesselCall.id}>
                {vesselCall.callReference}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Type">
          <select
            value={values.movementType}
            onChange={(event) =>
              setValues({ ...values, movementType: event.target.value as MovementType })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {movementTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as MovementStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {movementStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Planned time">
          <input
            type="datetime-local"
            value={values.plannedAt}
            onChange={(event) => setValues({ ...values, plannedAt: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Actual time">
          <input
            type="datetime-local"
            value={values.actualAt}
            onChange={(event) => setValues({ ...values, actualAt: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="From berth ID">
          <input
            value={values.fromBerthId}
            onChange={(event) => setValues({ ...values, fromBerthId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="To berth ID">
          <input
            value={values.toBerthId}
            onChange={(event) => setValues({ ...values, toBerthId: event.target.value })}
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
          disabled={isSubmitting || vesselCalls.length === 0}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : movement ? 'Update movement' : 'Create movement'}
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
