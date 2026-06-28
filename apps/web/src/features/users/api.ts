import type {
  AssignUserRoleInput,
  CreateUserInput,
  PaginatedResponse,
  UpdateUserInput,
  UserListQuery,
  UserRecord,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listUsers(query: UserListQuery): Promise<PaginatedResponse<UserRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<UserRecord>>(`/api/v1/users?${params.toString()}`);
}

export function createUser(input: CreateUserInput): Promise<UserRecord> {
  return requestJson<UserRecord>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UpdateUserInput): Promise<UserRecord> {
  return requestJson<UserRecord>(`/api/v1/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deactivateUser(id: string): Promise<UserRecord> {
  return requestJson<UserRecord>(`/api/v1/users/${id}`, {
    method: 'DELETE',
  });
}

export function assignUserRole(id: string, input: AssignUserRoleInput): Promise<UserRecord> {
  return requestJson<UserRecord>(`/api/v1/users/${id}/roles`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removeUserRole(id: string, roleId: string): Promise<UserRecord> {
  return requestJson<UserRecord>(`/api/v1/users/${id}/roles/${roleId}`, {
    method: 'DELETE',
  });
}
