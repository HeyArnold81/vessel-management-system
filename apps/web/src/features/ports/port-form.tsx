'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type { CreatePortInput, PortRecord, PortStatus } from '@vms/shared';
import { portStatuses } from '@vms/shared';

type PortFormProps = {
  readonly port?: PortRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreatePortInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function PortForm({ port, isSubmitting, onSubmit, onCancel }: PortFormProps) {
  const initialValues = useMemo(
    () => ({
      countryId: port?.countryId ?? '',
      unlocode: port?.unlocode ?? '',
      name: port?.name ?? '',
      timeZone: port?.timeZone ?? 'Europe/London',
      status: port?.status ?? 'active',
    }),
    [port],
  );
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      countryId: values.countryId,
      unlocode: values.unlocode.toUpperCase(),
      name: values.name,
      timeZone: values.timeZone,
      status: values.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input
            required
            minLength={2}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="UN/LOCODE">
          <input
            required
            pattern="[A-Z]{2}[A-Z0-9]{3}"
            value={values.unlocode}
            onChange={(event) =>
              setValues({ ...values, unlocode: event.target.value.toUpperCase() })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
          />
        </Field>

        <Field label="Country ID">
          <input
            required
            value={values.countryId}
            onChange={(event) => setValues({ ...values, countryId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Time zone">
          <input
            required
            value={values.timeZone}
            onChange={(event) => setValues({ ...values, timeZone: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) => setValues({ ...values, status: event.target.value as PortStatus })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {portStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
      </div>

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
          disabled={isSubmitting}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : port ? 'Update port' : 'Create port'}
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
