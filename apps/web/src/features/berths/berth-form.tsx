'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type { BerthRecord, BerthStatus, CreateBerthInput } from '@vms/shared';
import { berthStatuses } from '@vms/shared';

type BerthFormProps = {
  readonly berth?: BerthRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateBerthInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function BerthForm({ berth, isSubmitting, onSubmit, onCancel }: BerthFormProps) {
  const initialValues = useMemo(
    () => ({
      terminalId: berth?.terminalId ?? '',
      code: berth?.code ?? '',
      name: berth?.name ?? '',
      maxLengthM: berth?.maxLengthM ?? '',
      maxDraftM: berth?.maxDraftM ?? '',
      status: berth?.status ?? 'active',
    }),
    [berth],
  );
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      terminalId: values.terminalId,
      code: values.code.toUpperCase(),
      name: values.name,
      maxLengthM: values.maxLengthM ? Number(values.maxLengthM) : null,
      maxDraftM: values.maxDraftM ? Number(values.maxDraftM) : null,
      status: values.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Terminal ID">
          <input
            required
            value={values.terminalId}
            onChange={(event) => setValues({ ...values, terminalId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Code">
          <input
            required
            minLength={1}
            value={values.code}
            onChange={(event) => setValues({ ...values, code: event.target.value.toUpperCase() })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
          />
        </Field>

        <Field label="Name">
          <input
            required
            minLength={2}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as BerthStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {berthStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Max length metres">
          <input
            type="number"
            min="1"
            max="600"
            step="0.1"
            value={values.maxLengthM}
            onChange={(event) => setValues({ ...values, maxLengthM: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Max draft metres">
          <input
            type="number"
            min="0.1"
            max="40"
            step="0.1"
            value={values.maxDraftM}
            onChange={(event) => setValues({ ...values, maxDraftM: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
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
          {isSubmitting ? 'Saving...' : berth ? 'Update berth' : 'Create berth'}
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
