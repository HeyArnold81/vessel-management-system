import type {
  CreateRoleInput,
  PaginatedResponse,
  PermissionRecord,
  RoleListQuery,
  RoleRecord,
  UpdateRoleInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listRoles(query: RoleListQuery): Promise<PaginatedResponse<RoleRecord>> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return requestJson<PaginatedResponse<RoleRecord>>(`/api/v1/roles?${params.toString()}`);
}

export function listPermissions(): Promise<readonly PermissionRecord[]> {
  return requestJson<readonly PermissionRecord[]>('/api/v1/roles/permissions');
}

export function createRole(input: CreateRoleInput): Promise<RoleRecord> {
  return requestJson<RoleRecord>('/api/v1/roles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateRole(id: string, input: UpdateRoleInput): Promise<RoleRecord> {
  return requestJson<RoleRecord>(`/api/v1/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteRole(id: string): Promise<RoleRecord> {
  return requestJson<RoleRecord>(`/api/v1/roles/${id}`, {
    method: 'DELETE',
  });
}
