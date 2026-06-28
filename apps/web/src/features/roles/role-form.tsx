'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import type { CreateRoleInput, PermissionRecord, RoleRecord } from '@vms/shared';

type RoleFormProps = {
  readonly role?: RoleRecord;
  readonly permissions: readonly PermissionRecord[];
  readonly isSubmitting: boolean;
  readonly onSubmit: (input: CreateRoleInput) => Promise<void>;
  readonly onCancel?: () => void;
};

export function RoleForm({ role, permissions, isSubmitting, onSubmit, onCancel }: RoleFormProps) {
  const initialValues = useMemo(
    () => ({
      code: role?.code ?? '',
      name: role?.name ?? '',
      description: role?.description ?? '',
      permissionIds: role?.permissions.map((permission) => permission.id) ?? [],
    }),
    [role],
  );
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      code: values.code,
      name: values.name,
      description: values.description || null,
      permissionIds: values.permissionIds,
    });
  }

  function togglePermission(permissionId: string) {
    setValues((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Role code">
          <input
            required
            disabled={Boolean(role)}
            value={values.code}
            onChange={(event) => setValues({ ...values, code: event.target.value.toLowerCase() })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          />
        </Field>

        <Field label="Role name">
          <input
            required
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>

        <Field label="Description">
          <input
            value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </Field>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-ink">Permissions</span>
        <div className="max-h-80 overflow-auto rounded-md border border-slate-200">
          {permissions.map((permission) => (
            <label
              key={permission.id}
              className="flex items-start gap-3 border-b border-slate-100 px-3 py-3 last:border-0"
            >
              <input
                type="checkbox"
                checked={values.permissionIds.includes(permission.id)}
                onChange={() => togglePermission(permission.id)}
                className="mt-1"
              />
              <span className="grid gap-1 text-sm">
                <span className="font-semibold text-ink">{permission.code}</span>
                <span className="text-steel">
                  {permission.description ?? 'Application permission'}
                </span>
              </span>
            </label>
          ))}
          {permissions.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-steel">
              No permissions are available yet.
            </p>
          ) : null}
        </div>
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
          disabled={isSubmitting || Boolean(role?.isSystemRole)}
          className="rounded-md bg-harbor px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : role ? 'Update role' : 'Create role'}
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
