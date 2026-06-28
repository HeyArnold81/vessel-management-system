'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type {
  CreateServiceCatalogInput,
  ServiceCatalogRecord,
  ServiceCatalogStatus,
  ServiceCategory,
} from '@vms/shared';
import { serviceCatalogStatuses, serviceCategories } from '@vms/shared';

type ServiceFormProps = {
  readonly service?: ServiceCatalogRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateServiceCatalogInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function ServiceForm({ service, isSubmitting, onSubmit, onCancel }: ServiceFormProps) {
  const initialValues = useMemo(
    () => ({
      code: service?.code ?? '',
      name: service?.name ?? '',
      category: service?.category ?? 'other',
      defaultUnit: service?.defaultUnit ?? 'job',
      isBillable: service?.isBillable ?? true,
      status: service?.status ?? 'active',
    }),
    [service],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      code: values.code.toUpperCase(),
      name: values.name,
      category: values.category,
      defaultUnit: values.defaultUnit,
      isBillable: values.isBillable,
      status: values.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Service code">
          <input
            required
            minLength={2}
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

        <Field label="Category">
          <select
            value={values.category}
            onChange={(event) =>
              setValues({ ...values, category: event.target.value as ServiceCategory })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {serviceCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Default unit">
          <input
            required
            value={values.defaultUnit}
            onChange={(event) => setValues({ ...values, defaultUnit: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as ServiceCatalogStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {serviceCatalogStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={values.isBillable}
            onChange={(event) => setValues({ ...values, isBillable: event.target.checked })}
            className="h-4 w-4"
          />
          Billable service
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
          {isSubmitting ? 'Saving...' : service ? 'Update service' : 'Create service'}
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
