'use client';

import { useEffect, useState } from 'react';

import type { CreateRoleInput, PaginatedResponse, PermissionRecord, RoleRecord } from '@vms/shared';

import { ApiClientError } from '@/lib/api/http';

import { createRole, deleteRole, listPermissions, listRoles, updateRole } from './api';
import { RoleForm } from './role-form';

const initialPage: PaginatedResponse<RoleRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function RolesPage() {
  const [page, setPage] = useState(initialPage);
  const [permissions, setPermissions] = useState<readonly PermissionRecord[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function loadRoles(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listRoles({
        page: nextPage,
        pageSize: 10,
        search,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load roles.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [roleResult, permissionResult] = await Promise.all([
          listRoles({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc' }),
          listPermissions(),
        ]);

        setPage(roleResult);
        setPermissions(permissionResult);
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load roles.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitRole(input: CreateRoleInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: input.name,
          description: input.description,
          permissionIds: input.permissionIds,
        });
      } else {
        await createRole(input);
      }
      setEditingRole(undefined);
      await loadRoles(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function retireRole(role: RoleRecord) {
    setError(null);

    try {
      await deleteRole(role.id);
      await loadRoles(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to retire role.');
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbor">
              Identity and access
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Roles</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage tenant roles and permission assignments. System roles are visible but
              protected.
            </p>
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

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <RoleForm
            key={editingRole?.id ?? 'new-role'}
            role={editingRole}
            permissions={permissions}
            isSubmitting={isSubmitting}
            onSubmit={submitRole}
            onCancel={editingRole ? () => setEditingRole(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                placeholder="Search roles"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <button
                onClick={() => void loadRoles(1)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Permissions</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((role) => (
                    <tr key={role.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-ink">{role.name}</p>
                        <p className="text-xs text-steel">{role.code}</p>
                      </td>
                      <td className="py-3 pr-4 text-steel">
                        {role.isSystemRole ? 'System' : 'Tenant'}
                      </td>
                      <td className="py-3 pr-4 text-steel">{role.permissions.length}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingRole(role)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            disabled={role.isSystemRole}
                            onClick={() => void retireRole(role)}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700 disabled:opacity-50"
                          >
                            Retire
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No roles match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading roles...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} roles
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadRoles(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadRoles(currentPage + 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
