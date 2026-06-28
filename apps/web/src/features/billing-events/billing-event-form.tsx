'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type {
  BillingEventRecord,
  BillingEventStatus,
  CreateBillingEventInput,
  MovementServiceRecord,
  UpdateBillingEventInput,
} from '@vms/shared';
import { billingEventStatuses } from '@vms/shared';

type BillingEventFormProps = {
  readonly billingEvent?: BillingEventRecord;
  readonly movementServices: readonly MovementServiceRecord[];
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateBillingEventInput | UpdateBillingEventInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function BillingEventForm({
  billingEvent,
  movementServices,
  isSubmitting,
  onSubmit,
  onCancel,
}: BillingEventFormProps) {
  const initialValues = useMemo(
    () => ({
      movementServiceId: billingEvent?.movementServiceId ?? movementServices[0]?.id ?? '',
      eventReference: billingEvent?.eventReference ?? '',
      status: billingEvent?.status ?? 'draft',
      erpSystem: billingEvent?.erpSystem ?? 'SAP',
      exportBatchId: billingEvent?.exportBatchId ?? '',
      failureReason: billingEvent?.failureReason ?? '',
    }),
    [billingEvent, movementServices],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (billingEvent) {
      await onSubmit({
        status: values.status,
        erpSystem: values.erpSystem || null,
        exportBatchId: values.exportBatchId || null,
        failureReason: values.failureReason || null,
      });
      return;
    }

    await onSubmit({
      movementServiceId: values.movementServiceId,
      eventReference: values.eventReference || undefined,
      erpSystem: values.erpSystem || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Movement service">
          <select
            required
            disabled={Boolean(billingEvent)}
            value={values.movementServiceId}
            onChange={(event) => setValues({ ...values, movementServiceId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          >
            <option value="">Select service</option>
            {movementServices.map((movementService) => (
              <option key={movementService.id} value={movementService.id}>
                {movementService.quantity} {movementService.unitOfMeasure} ·{' '}
                {movementService.status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Event reference">
          <input
            disabled={Boolean(billingEvent)}
            value={values.eventReference}
            onChange={(event) =>
              setValues({ ...values, eventReference: event.target.value.toUpperCase() })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase disabled:bg-slate-100"
          />
        </Field>

        <Field label="Status">
          <select
            disabled={!billingEvent}
            value={values.status}
            onChange={(event) =>
              setValues({ ...values, status: event.target.value as BillingEventStatus })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          >
            {billingEventStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="ERP system">
          <input
            value={values.erpSystem}
            onChange={(event) => setValues({ ...values, erpSystem: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 uppercase"
          />
        </Field>

        <Field label="Export batch ID">
          <input
            disabled={!billingEvent}
            value={values.exportBatchId}
            onChange={(event) => setValues({ ...values, exportBatchId: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          />
        </Field>

        <Field label="Failure reason">
          <input
            disabled={!billingEvent}
            value={values.failureReason}
            onChange={(event) => setValues({ ...values, failureReason: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
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
          disabled={isSubmitting || movementServices.length === 0}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : billingEvent ? 'Update event' : 'Generate event'}
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
