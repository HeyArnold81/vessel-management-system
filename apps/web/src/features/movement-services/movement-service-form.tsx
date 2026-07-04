'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type {
  CreateMovementServiceInput,
  MovementRecord,
  MovementServiceRecord,
  MovementServiceStatus,
  OrganizationRecord,
  ServiceCatalogRecord,
} from '@vms/shared';
import { movementServiceStatuses } from '@vms/shared';

type MovementServiceFormProps = {
  readonly movementService?: MovementServiceRecord;
  readonly movements: readonly MovementRecord[];
  readonly services: readonly ServiceCatalogRecord[];
  readonly organizations: readonly OrganizationRecord[];
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateMovementServiceInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function MovementServiceForm({
  movementService,
  movements,
  services,
  organizations,
  isSubmitting,
  onSubmit,
  onCancel,
}: MovementServiceFormProps) {
  const selectedCatalogService = services.find(
    (service) => service.id === (movementService?.serviceId ?? services[0]?.id),
  );
  const initialValues = useMemo(
    () => ({
      movementId: movementService?.movementId ?? movements[0]?.id ?? '',
      serviceId: movementService?.serviceId ?? services[0]?.id ?? '',
      providerOrganizationId: movementService?.providerOrganizationId ?? '',
      serviceReceiverOrganizationId: movementService?.serviceReceiverOrganizationId ?? '',
      billToOrganizationId: movementService?.billToOrganizationId ?? '',
      payerOrganizationId: movementService?.payerOrganizationId ?? '',
      status: movementService?.status ?? 'requested',
      quantity: movementService?.quantity ?? '1',
      unitOfMeasure: movementService?.unitOfMeasure ?? selectedCatalogService?.defaultUnit ?? 'job',
      requestedAt: toInputDateTime(movementService?.requestedAt),
      completedAt: toInputDateTime(movementService?.completedAt),
      isBillable: movementService?.isBillable ?? selectedCatalogService?.isBillable ?? true,
    }),
    [movementService, movements, selectedCatalogService, services],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      movementId: values.movementId,
      serviceId: values.serviceId,
      providerOrganizationId: values.providerOrganizationId || null,
      serviceReceiverOrganizationId: values.serviceReceiverOrganizationId || null,
      billToOrganizationId: values.billToOrganizationId || null,
      payerOrganizationId: values.payerOrganizationId || null,
      status: values.status,
      quantity: Number(values.quantity),
      unitOfMeasure: values.unitOfMeasure,
      requestedAt: toIsoString(values.requestedAt),
      completedAt: toIsoString(values.completedAt),
      isBillable: values.isBillable,
    });
  }

  function selectService(serviceId: string) {
    const service = services.find((candidate) => candidate.id === serviceId);
    setValues({
      ...values,
      serviceId,
      unitOfMeasure: service?.defaultUnit ?? values.unitOfMeasure,
      isBillable: service?.isBillable ?? values.isBillable,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Movement">
          <select
            required
            value={values.movementId}
            onChange={(event) => setValues({ ...values, movementId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select movement</option>
            {movements.map((movement) => (
              <option key={movement.id} value={movement.id}>
                {movement.movementReference} · {movement.movementType}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service">
          <select
            required
            value={values.serviceId}
            onChange={(event) => selectService(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Select service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {service.code}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as MovementServiceStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {movementServiceStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service provider">
          <select
            value={values.providerOrganizationId}
            onChange={(event) =>
              setValues({ ...values, providerOrganizationId: event.target.value })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">No service provider selected</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {formatOrganizationName(organization)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service receiver">
          <select
            value={values.serviceReceiverOrganizationId}
            onChange={(event) =>
              setValues({ ...values, serviceReceiverOrganizationId: event.target.value })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">No service receiver selected</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {formatOrganizationName(organization)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bill-to party">
          <select
            value={values.billToOrganizationId}
            onChange={(event) => setValues({ ...values, billToOrganizationId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">No bill-to party selected</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {formatOrganizationName(organization)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Payer">
          <select
            value={values.payerOrganizationId}
            onChange={(event) => setValues({ ...values, payerOrganizationId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">No payer selected</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {formatOrganizationName(organization)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Quantity">
          <input
            required
            type="number"
            min="0.001"
            step="0.001"
            value={values.quantity}
            onChange={(event) => setValues({ ...values, quantity: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Unit">
          <input
            required
            value={values.unitOfMeasure}
            onChange={(event) => setValues({ ...values, unitOfMeasure: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Requested time">
          <input
            type="datetime-local"
            value={values.requestedAt}
            onChange={(event) => setValues({ ...values, requestedAt: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Completed time">
          <input
            type="datetime-local"
            value={values.completedAt}
            onChange={(event) => setValues({ ...values, completedAt: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={values.isBillable}
            onChange={(event) => setValues({ ...values, isBillable: event.target.checked })}
            className="h-4 w-4"
          />
          Billable
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
          disabled={isSubmitting || movements.length === 0 || services.length === 0}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : movementService ? 'Update service' : 'Attach service'}
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

function formatOrganizationName(organization: OrganizationRecord): string {
  return organization.tradingName
    ? `${organization.tradingName} · ${organization.legalName}`
    : organization.legalName;
}

function toInputDateTime(value: string | null | undefined): string {
  return value ? value.slice(0, 16) : '';
}

function toIsoString(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
