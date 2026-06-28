import { Inject, Injectable } from '@nestjs/common';
import type { Permission, Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service.js';
import type {
  MatrixRole,
  PermissionGroupWithPermissions,
  PermissionWithGroup,
} from './permission.mapper.js';

export interface PermissionsRepository {
  listPermissions(): Promise<readonly PermissionWithGroup[]>;
  listGroups(): Promise<readonly PermissionGroupWithPermissions[]>;
  listMatrixRoles(tenantId: string): Promise<readonly MatrixRole[]>;
  findRoleById(tenantId: string, roleId: string): Promise<MatrixRole | null>;
  findPermissions(permissionIds: readonly string[]): Promise<readonly Permission[]>;
  updateRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[],
  ): Promise<MatrixRole>;
}

export const PERMISSIONS_REPOSITORY = Symbol('PERMISSIONS_REPOSITORY');

const permissionInclude = {
  permissionGroup: true,
} satisfies Prisma.PermissionInclude;

const roleInclude = {
  rolePermissions: {
    include: { permission: { include: permissionInclude } },
    orderBy: { permission: { code: 'asc' } },
  },
} satisfies Prisma.RoleInclude;

@Injectable()
export class PrismaPermissionsRepository implements PermissionsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  listPermissions(): Promise<readonly PermissionWithGroup[]> {
    return this.prisma.permission.findMany({
      include: permissionInclude,
      orderBy: [{ permissionGroup: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  listGroups(): Promise<readonly PermissionGroupWithPermissions[]> {
    return this.prisma.permissionGroup.findMany({
      include: {
        permissions: {
          include: permissionInclude,
          orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  listMatrixRoles(tenantId: string): Promise<readonly MatrixRole[]> {
    return this.prisma.role.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }], deletedAt: null },
      include: roleInclude,
      orderBy: [{ isSystemRole: 'desc' }, { name: 'asc' }],
    });
  }

  findRoleById(tenantId: string, roleId: string): Promise<MatrixRole | null> {
    return this.prisma.role.findFirst({
      where: { id: roleId, OR: [{ tenantId }, { tenantId: null }], deletedAt: null },
      include: roleInclude,
    });
  }

  findPermissions(permissionIds: readonly string[]): Promise<readonly Permission[]> {
    return this.prisma.permission.findMany({
      where: { id: { in: [...permissionIds] } },
      orderBy: { code: 'asc' },
    });
  }

  updateRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: readonly string[],
  ): Promise<MatrixRole> {
    const uniquePermissionIds = [...new Set(permissionIds)];

    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });

      return tx.role.update({
        where: { id: roleId, tenantId },
        data: {
          isPrivileged: await this.hasPrivilegedPermission(tx, uniquePermissionIds),
          requiresApproval: await this.hasPrivilegedPermission(tx, uniquePermissionIds),
          rolePermissions: {
            create: uniquePermissionIds.map((permissionId) => ({ permissionId })),
          },
        },
        include: roleInclude,
      });
    });
  }

  private async hasPrivilegedPermission(
    tx: Prisma.TransactionClient,
    permissionIds: readonly string[],
  ): Promise<Role['isPrivileged']> {
    if (permissionIds.length === 0) {
      return false;
    }

    const count = await tx.permission.count({
      where: { id: { in: [...permissionIds] }, isPrivileged: true },
    });

    return count > 0;
  }
}
