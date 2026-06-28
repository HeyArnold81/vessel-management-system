import type { Permission, Prisma } from '@prisma/client';

import type { PermissionRecord, RoleRecord } from '@vms/shared';

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: { rolePermissions: { include: { permission: { include: { permissionGroup: true } } } } };
}>;

export function toRoleRecord(role: RoleWithPermissions): RoleRecord {
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

export function toPermissionRecord(permission: Permission): PermissionRecord {
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
