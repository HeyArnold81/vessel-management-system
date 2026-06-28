'use client';

import { useEffect, useState } from 'react';

import type {
  CreateUserInput,
  AuthProvider,
  PaginatedResponse,
  RoleRecord,
  UserRecord,
  UserStatus,
} from '@vms/shared';
import { authProviders, userStatuses } from '@vms/shared';

import { listRoles } from '@/features/roles/api';
import { ApiClientError } from '@/lib/api/http';

import {
  assignUserRole,
  createUser,
  deactivateUser,
  listUsers,
  removeUserRole,
  updateUser,
} from './api';
import { UserForm } from './user-form';

const initialPage: PaginatedResponse<UserRecord> = {
  data: [],
  meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 },
};

export function UsersPage() {
  const [page, setPage] = useState(initialPage);
  const [roles, setRoles] = useState<readonly RoleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [authProvider, setAuthProvider] = useState<AuthProvider | ''>('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function loadUsers(nextPage = currentPage) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listUsers({
        page: nextPage,
        pageSize: 10,
        search,
        status: status || undefined,
        authProvider: authProvider || undefined,
        sortBy: 'displayName',
        sortDirection: 'asc',
      });
      setPage(result);
      setCurrentPage(nextPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      setError(null);

      try {
        const [userResult, roleResult] = await Promise.all([
          listUsers({ page: 1, pageSize: 10, sortBy: 'displayName', sortDirection: 'asc' }),
          listRoles({ page: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' }),
        ]);

        setPage(userResult);
        setRoles(roleResult.data);
        setSelectedRoleId(roleResult.data[0]?.id ?? '');
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : 'Unable to load users.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  async function submitUser(input: CreateUserInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, input);
      } else {
        await createUser(input);
      }
      setEditingUser(undefined);
      await loadUsers(1);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to save user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function assignRole(user: UserRecord) {
    if (!selectedRoleId) {
      return;
    }

    setError(null);

    try {
      await assignUserRole(user.id, { roleId: selectedRoleId });
      await loadUsers(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to assign role.');
    }
  }

  async function removeRole(user: UserRecord, roleId: string) {
    setError(null);

    try {
      await removeUserRole(user.id, roleId);
      await loadUsers(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to remove role.');
    }
  }

  async function deactivate(user: UserRecord) {
    setError(null);

    try {
      await deactivateUser(user.id);
      await loadUsers(currentPage);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Unable to deactivate user.');
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
            <h1 className="mt-1 text-3xl font-semibold text-ink">Users</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
              Manage MVP local users and role assignments while keeping enterprise identity
              external.
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
          <UserForm
            key={editingUser?.id ?? 'new-user'}
            user={editingUser}
            isSubmitting={isSubmitting}
            onSubmit={submitUser}
            onCancel={editingUser ? () => setEditingUser(undefined) : undefined}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_auto]">
              <input
                placeholder="Search users"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as UserStatus | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by status"
              >
                <option value="">Any status</option>
                {userStatuses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={authProvider}
                onChange={(event) => setAuthProvider(event.target.value as AuthProvider | '')}
                className="rounded-md border border-slate-300 px-3 py-2"
                aria-label="Filter by authentication source"
              >
                <option value="">Any source</option>
                {authProviders.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void loadUsers(1)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                aria-label="Role to assign"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-steel">Select a role, then use Assign on a user.</span>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-steel">
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Roles</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {page.data.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-ink">{user.displayName}</p>
                        <p className="text-xs text-steel">{user.email}</p>
                      </td>
                      <td className="py-3 pr-4 text-steel">{user.authProvider}</td>
                      <td className="py-3 pr-4 text-steel">{user.status}</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => void removeRole(user, role.id)}
                              className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-steel"
                            >
                              {role.name}
                            </button>
                          ))}
                          {user.roles.length === 0 ? (
                            <span className="text-xs text-steel">No roles</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => void assignRole(user)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 font-semibold text-steel"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void deactivate(user)}
                            className="rounded-md border border-red-200 px-3 py-1.5 font-semibold text-red-700"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && page.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-steel">
                  No users match the current filters.
                </p>
              ) : null}
              {isLoading ? (
                <p className="py-8 text-center text-sm text-steel">Loading users...</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
              <span>
                Page {page.meta.page} of {page.meta.totalPages} · {page.meta.totalItems} users
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => void loadUsers(currentPage - 1)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= page.meta.totalPages}
                  onClick={() => void loadUsers(currentPage + 1)}
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
