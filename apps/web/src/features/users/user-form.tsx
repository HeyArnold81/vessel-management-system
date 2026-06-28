'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type { AuthProvider, CreateUserInput, UserRecord, UserStatus } from '@vms/shared';
import { authProviders, userStatuses } from '@vms/shared';

type UserFormProps = {
  readonly user?: UserRecord;
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateUserInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function UserForm({ user, isSubmitting, onSubmit, onCancel }: UserFormProps) {
  const initialValues = useMemo(
    () => ({
      email: user?.email ?? '',
      displayName: user?.displayName ?? '',
      authProvider: user?.authProvider ?? 'local',
      externalSubject: user?.externalSubject ?? '',
      status: user?.status ?? 'invited',
    }),
    [user],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      email: values.email,
      displayName: values.displayName,
      authProvider: values.authProvider,
      externalSubject: values.externalSubject || null,
      status: values.status,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Display name">
          <input
            required
            value={values.displayName}
            onChange={(event) => setValues({ ...values, displayName: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={values.email}
            onChange={(event) => setValues({ ...values, email: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Authentication source">
          <select
            value={values.authProvider}
            onChange={(event) =>
              setValues({ ...values, authProvider: event.target.value as AuthProvider })
            }
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {authProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={values.status}
            onChange={(event) => setValues({ ...values, status: event.target.value as UserStatus })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {userStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="External subject">
          <input
            value={values.externalSubject}
            onChange={(event) => setValues({ ...values, externalSubject: event.target.value })}
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
          {isSubmitting ? 'Saving...' : user ? 'Update user' : 'Create user'}
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
