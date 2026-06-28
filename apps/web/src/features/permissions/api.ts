import type {
  PermissionGroupRecord,
  PermissionMatrixRecord,
  PermissionRecord,
  RoleRecord,
  UpdateRolePermissionsInput,
} from '@vms/shared';

import { requestJson } from '@/lib/api/http';

export function listPermissions(): Promise<readonly PermissionRecord[]> {
  return requestJson<readonly PermissionRecord[]>('/api/v1/permissions');
}

export function listPermissionGroups(): Promise<readonly PermissionGroupRecord[]> {
  return requestJson<readonly PermissionGroupRecord[]>('/api/v1/permissions/groups');
}

export function getPermissionMatrix(): Promise<PermissionMatrixRecord> {
  return requestJson<PermissionMatrixRecord>('/api/v1/permissions/matrix');
}

export function updateRolePermissions(
  roleId: string,
  input: UpdateRolePermissionsInput,
): Promise<RoleRecord> {
  return requestJson<RoleRecord>(`/api/v1/permissions/roles/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
