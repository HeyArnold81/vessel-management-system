'use client';

import { type FormEvent, useMemo, useState } from 'react';

import type {
  CargoCategory,
  CargoItemRecord,
  CargoItemStatus,
  CreateCargoItemInput,
} from '@vms/shared';
import { cargoCategories, cargoItemStatuses } from '@vms/shared';

type CargoFormProps = {
  readonly cargoItem?: CargoItemRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateCargoItemInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function CargoForm({ cargoItem, isSubmitting, onSubmit, onCancel }: CargoFormProps) {
  const initialValues = useMemo(
    () => ({
      cargoCode: cargoItem?.cargoCode ?? '',
      name: cargoItem?.name ?? '',
      cargoCategory: cargoItem?.cargoCategory ?? 'general',
      unNumber: cargoItem?.unNumber ?? '',
      isHazardous: cargoItem?.isHazardous ?? false,
      status: cargoItem?.status ?? 'active',
    }),
    [cargoItem],
  );
  const [values, setValues] = useState(initialValues);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      cargoCode: values.cargoCode.toUpperCase(),
      name: values.name,
      cargoCategory: values.cargoCategory,
      unNumber: values.unNumber || null,
      isHazardous: values.isHazardous,
      status: values.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cargo code">
          <input
            required
            minLength={2}
            value={values.cargoCode}
            onChange={(event) =>
              setValues({ ...values, cargoCode: event.target.value.toUpperCase() })
            }
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

        <Field label="Category">
          <select
            value={values.cargoCategory}
            onChange={(event) =>
              setValues({ ...values, cargoCategory: event.target.value as CargoCategory })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {cargoCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as CargoItemStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {cargoItemStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="UN number">
          <input
            pattern="\d{4}"
            value={values.unNumber}
            onChange={(event) => setValues({ ...values, unNumber: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={values.isHazardous}
            onChange={(event) => setValues({ ...values, isHazardous: event.target.checked })}
            className="h-4 w-4"
          />
          Hazardous cargo
        </label>
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
          {isSubmitting ? 'Saving...' : cargoItem ? 'Update cargo' : 'Create cargo'}
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
