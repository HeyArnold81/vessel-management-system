import type { Prisma } from '@prisma/client';

import type { AuthProvider, RoleSummary, UserRecord, UserStatus } from '@vms/shared';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

export function toUserRecord(user: UserWithRoles): UserRecord {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    displayName: user.displayName,
    authProvider: user.authProvider as AuthProvider,
    externalSubject: user.externalSubject,
    status: user.status as UserStatus,
    roles: user.roles.map(toRoleSummary),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function toRoleSummary(userRole: UserWithRoles['roles'][number]): RoleSummary {
  return {
    id: userRole.role.id,
    code: userRole.role.code,
    name: userRole.role.name,
    isSystemRole: userRole.role.isSystemRole,
  };
}
