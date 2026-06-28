import type { Permission, PermissionGroup, Prisma } from '@prisma/client';

import type {
  PermissionGroupRecord,
  PermissionMatrixRecord,
  PermissionRecord,
  RoleRecord,
} from '@vms/shared';

export type PermissionWithGroup = Permission & {
  readonly permissionGroup: PermissionGroup | null;
};

export type PermissionGroupWithPermissions = PermissionGroup & {
  readonly permissions: readonly PermissionWithGroup[];
};

export type MatrixRole = Prisma.RoleGetPayload<{
  include: { rolePermissions: { include: { permission: { include: { permissionGroup: true } } } } };
}>;

export function toPermissionRecord(permission: PermissionWithGroup | Permission): PermissionRecord {
  return {
    id: permission.id,
    permissionGroupId: permission.permissionGroupId,
    code: permission.code,
    description: permission.description,
    resource: permission.resource,
    action: permission.action,
    isPrivileged: permission.isPrivileged,
    sortOrder: permission.sortOrder,
  };
}

export function toPermissionGroupRecord(
  group: PermissionGroupWithPermissions,
): PermissionGroupRecord {
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    description: group.description,
    sortOrder: group.sortOrder,
    permissions: group.permissions.map(toPermissionRecord),
  };
}

export function toRoleRecord(role: MatrixRole): RoleRecord {
  return {
    id: role.id,
    tenantId: role.tenantId,
    code: role.code,
    name: role.name,
    description: role.description,
    status: role.status as RoleRecord['status'],
    isSystemRole: role.isSystemRole,
    isPrivileged: role.isPrivileged,
    requiresApproval: role.requiresApproval,
    permissions: role.rolePermissions.map((item) => toPermissionRecord(item.permission)),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    deletedAt: role.deletedAt?.toISOString() ?? null,
  };
}

export function toPermissionMatrixRecord(
  groups: readonly PermissionGroupRecord[],
  roles: readonly MatrixRole[],
): PermissionMatrixRecord {
  return {
    groups,
    roles: roles.map((role) => ({
      role: toRoleRecord(role),
      permissionIds: role.rolePermissions.map((item) => item.permissionId),
    })),
  };
}
