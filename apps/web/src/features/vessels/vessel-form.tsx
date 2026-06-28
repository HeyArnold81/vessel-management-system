'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type { CreateVesselInput, VesselRecord, VesselStatus } from '@vms/shared';
import { vesselStatuses, vesselTypes } from '@vms/shared';

type VesselFormProps = {
  readonly vessel?: VesselRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateVesselInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function VesselForm({ vessel, isSubmitting, onSubmit, onCancel }: VesselFormProps) {
  const initialValues = useMemo(
    () => ({
      name: vessel?.name ?? '',
      imoNumber: vessel?.imoNumber ?? '',
      mmsi: vessel?.mmsi ?? '',
      callSign: vessel?.callSign ?? '',
      vesselType: vessel?.vesselType ?? vesselTypes[0],
      grossTonnage: vessel?.grossTonnage ?? '',
      lengthOverallM: vessel?.lengthOverallM ?? '',
      maxDraftM: vessel?.maxDraftM ?? '',
      status: vessel?.status ?? 'active',
    }),
    [vessel],
  );
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      name: values.name,
      imoNumber: values.imoNumber,
      mmsi: values.mmsi || null,
      callSign: values.callSign || null,
      vesselType: values.vesselType,
      grossTonnage: values.grossTonnage ? Number(values.grossTonnage) : null,
      lengthOverallM: values.lengthOverallM ? Number(values.lengthOverallM) : null,
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
        <Field label="Name">
          <input
            required
            minLength={2}
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="IMO number">
          <input
            required
            pattern="\d{7}"
            value={values.imoNumber}
            onChange={(event) => setValues({ ...values, imoNumber: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Vessel type">
          <select
            value={values.vesselType}
            onChange={(event) => setValues({ ...values, vesselType: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {vesselTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as VesselStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {vesselStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="MMSI">
          <input
            pattern="\d{9}"
            value={values.mmsi}
            onChange={(event) => setValues({ ...values, mmsi: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Call sign">
          <input
            value={values.callSign}
            onChange={(event) => setValues({ ...values, callSign: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Gross tonnage">
          <input
            type="number"
            min="1"
            value={values.grossTonnage}
            onChange={(event) => setValues({ ...values, grossTonnage: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Max draft metres">
          <input
            type="number"
            min="0.1"
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
          {isSubmitting ? 'Saving...' : vessel ? 'Update vessel' : 'Create vessel'}
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
