'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PermissionMatrixRecord, RoleRecord } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { getPermissionMatrix, updateRolePermissions } from './api';

const initialMatrix: PermissionMatrixRecord = {
  groups: [],
  roles: [],
};

export function PermissionsPage() {
  const [matrix, setMatrix] = useState(initialMatrix);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = matrix.roles.find((item) => item.role.id === selectedRoleId)?.role;
  const selectedPermissionIds =
    matrix.roles.find((item) => item.role.id === selectedRoleId)?.permissionIds ?? [];
  const filteredRoles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return matrix.roles;
    }

    return matrix.roles.filter((item) => {
      const role = item.role;

      return (
        role.name.toLowerCase().includes(normalizedSearch) ||
        role.code.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [matrix.roles, search]);

  useEffect(() => {
    async function loadMatrix() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getPermissionMatrix();
        setMatrix(result);
        setSelectedRoleId(result.roles[0]?.role.id ?? null);
      } catch (caught) {
        setError(
          caught instanceof ApiClientError ? caught.message : 'Unable to load permission matrix.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadMatrix();
  }, []);

  async function togglePermission(role: RoleRecord, permissionId: string) {
    if (role.isSystemRole || savingRoleId) {
      return;
    }

    const currentRole = matrix.roles.find((item) => item.role.id === role.id);
    const currentPermissionIds = currentRole?.permissionIds ?? [];
    const nextPermissionIds = currentPermissionIds.includes(permissionId)
      ? currentPermissionIds.filter((id) => id !== permissionId)
      : [...currentPermissionIds, permissionId];

    setSavingRoleId(role.id);
    setError(null);

    try {
      const updatedRole = await updateRolePermissions(role.id, {
        permissionIds: nextPermissionIds,
      });
      setMatrix((current) => ({
        ...current,
        roles: current.roles.map((item) =>
          item.role.id === role.id
            ? {
                role: updatedRole,
                permissionIds: updatedRole.permissions.map((permission) => permission.id),
              }
            : item,
        ),
      }));
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : 'Unable to update role permissions.',
      );
    } finally {
      setSavingRoleId(null);
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Identity and access
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Permissions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Review and maintain role-level access across operational, billing, and administration
              capabilities.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric label="Roles" value={matrix.roles.length} />
            <Metric label="Groups" value={matrix.groups.length} />
            <Metric
              label="Permissions"
              value={matrix.groups.reduce((total, group) => total + group.permissions.length, 0)}
            />
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[20rem_1fr]">
          <div className="rounded-lg border border-line bg-panel p-4 shadow-panel">
            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Role search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles"
                className="rounded-md border border-line bg-surface px-3 py-2 text-ink"
              />
            </label>

            <div className="mt-4 grid gap-2">
              {filteredRoles.map((item) => (
                <button
                  key={item.role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(item.role.id)}
                  className={`rounded-md border px-3 py-3 text-left text-sm transition ${
                    selectedRoleId === item.role.id
                      ? 'border-harbor bg-harbor/10 text-ink'
                      : 'border-line bg-surface text-steel hover:border-harbor'
                  }`}
                >
                  <span className="block font-semibold text-ink">{item.role.name}</span>
                  <span className="mt-1 block text-xs">{item.role.code}</span>
                  <span className="mt-2 flex flex-wrap gap-2 text-xs">
                    <StatusPill>{item.role.isSystemRole ? 'System' : 'Tenant'}</StatusPill>
                    {item.role.isPrivileged ? <StatusPill>Privileged</StatusPill> : null}
                  </span>
                </button>
              ))}

              {!isLoading && filteredRoles.length === 0 ? (
                <p className="py-6 text-center text-sm text-steel">No roles found.</p>
              ) : null}
              {isLoading ? (
                <p className="py-6 text-center text-sm text-steel">Loading permissions...</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-panel shadow-panel">
            <div className="border-b border-line p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-ink">
                    {selectedRole?.name ?? 'Permission matrix'}
                  </h2>
                  <p className="mt-1 text-sm text-steel">
                    {selectedRole
                      ? selectedRole.isSystemRole
                        ? 'System roles are locked and can only be changed by catalogue migration.'
                        : 'Toggle permissions to update this tenant role.'
                      : 'Select a role to review permission assignments.'}
                  </p>
                </div>
                {selectedRole ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusPill>{selectedPermissionIds.length} assigned</StatusPill>
                    {savingRoleId === selectedRole.id ? <StatusPill>Saving</StatusPill> : null}
                    {selectedRole.requiresApproval ? (
                      <StatusPill>Approval required</StatusPill>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 p-5">
              {matrix.groups.map((group) => (
                <section key={group.id} className="grid gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                      {group.name}
                    </h3>
                    {group.description ? (
                      <p className="mt-1 text-sm text-steel">{group.description}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {group.permissions.map((permission) => {
                      const isChecked = selectedPermissionIds.includes(permission.id);
                      const isDisabled =
                        !selectedRole || selectedRole.isSystemRole || savingRoleId !== null;

                      return (
                        <label
                          key={permission.id}
                          className="flex min-h-24 items-start gap-3 rounded-md border border-line bg-surface px-3 py-3"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() =>
                              selectedRole
                                ? void togglePermission(selectedRole, permission.id)
                                : undefined
                            }
                            className="mt-1 h-4 w-4"
                            aria-label={`${permission.code} for ${selectedRole?.name ?? 'role'}`}
                          />
                          <span className="grid gap-1 text-sm">
                            <span className="font-semibold text-ink">{permission.code}</span>
                            <span className="text-steel">
                              {permission.description ?? 'Application permission'}
                            </span>
                            <span className="flex flex-wrap gap-2 text-xs">
                              {permission.action ? (
                                <StatusPill>{permission.action}</StatusPill>
                              ) : null}
                              {permission.isPrivileged ? <StatusPill>Privileged</StatusPill> : null}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              ))}

              {!isLoading && matrix.groups.length === 0 ? (
                <p className="py-12 text-center text-sm text-steel">
                  No permissions are available yet.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusPill({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <span className="rounded border border-line bg-panel px-2 py-0.5 font-medium text-steel">
      {children}
    </span>
  );
}
