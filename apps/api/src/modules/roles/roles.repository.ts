import { Inject, Injectable } from '@nestjs/common';
import type { Permission, Prisma } from '@prisma/client';

import type { CreateRoleInput, RoleSortField, SortDirection, UpdateRoleInput } from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';
import type { RoleWithPermissions } from './role.mapper.js';

export type RolePageResult = {
  readonly roles: readonly RoleWithPermissions[];
  readonly totalItems: number;
};

export type NormalizedRoleListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sortBy: RoleSortField;
  readonly sortDirection: SortDirection;
};

export interface RolesRepository {
  findPage(tenantId: string, query: NormalizedRoleListQuery): Promise<RolePageResult>;
  findById(tenantId: string, id: string): Promise<RoleWithPermissions | null>;
  findTenantRoleByCode(tenantId: string, code: string): Promise<RoleWithPermissions | null>;
  findPermissions(permissionIds: readonly string[]): Promise<readonly Permission[]>;
  listPermissions(): Promise<readonly Permission[]>;
  create(tenantId: string, input: CreateRoleInput): Promise<RoleWithPermissions>;
  update(tenantId: string, id: string, input: UpdateRoleInput): Promise<RoleWithPermissions>;
  softDelete(tenantId: string, id: string): Promise<RoleWithPermissions>;
}

export const ROLES_REPOSITORY = Symbol('ROLES_REPOSITORY');

const roleInclude = {
  rolePermissions: {
    include: { permission: { include: { permissionGroup: true } } },
    orderBy: { permission: { code: 'asc' } },
  },
} satisfies Prisma.RoleInclude;

@Injectable()
export class PrismaRolesRepository implements RolesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findPage(tenantId: string, query: NormalizedRoleListQuery): Promise<RolePageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [roles, totalItems] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: roleInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.role.count({ where }),
    ]);

    return { roles, totalItems };
  }

  findById(tenantId: string, id: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findFirst({
      where: { id, OR: [{ tenantId }, { tenantId: null }] },
      include: roleInclude,
    });
  }

  findTenantRoleByCode(tenantId: string, code: string): Promise<RoleWithPermissions | null> {
    return this.prisma.role.findFirst({
      where: { tenantId, code: code.trim().toLowerCase() },
      include: roleInclude,
    });
  }

  findPermissions(permissionIds: readonly string[]): Promise<readonly Permission[]> {
    return this.prisma.permission.findMany({
      where: { id: { in: [...permissionIds] } },
      orderBy: { code: 'asc' },
    });
  }

  listPermissions(): Promise<readonly Permission[]> {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }

  async create(tenantId: string, input: CreateRoleInput): Promise<RoleWithPermissions> {
    const permissionIds = [...new Set(input.permissionIds ?? [])];

    return this.prisma.role.create({
      data: {
        tenantId,
        code: input.code.trim().toLowerCase(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: 'active',
        isSystemRole: false,
        isPrivileged: false,
        requiresApproval: false,
        rolePermissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: roleInclude,
    });
  }

  async update(tenantId: string, id: string, input: UpdateRoleInput): Promise<RoleWithPermissions> {
    const permissionIds =
      input.permissionIds !== undefined ? [...new Set(input.permissionIds)] : undefined;

    return this.prisma.$transaction(async (tx) => {
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
      }

      return tx.role.update({
        where: { id, tenantId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(permissionIds !== undefined
            ? {
                rolePermissions: {
                  create: permissionIds.map((permissionId) => ({ permissionId })),
                },
              }
            : {}),
        },
        include: roleInclude,
      });
    });
  }

  softDelete(tenantId: string, id: string): Promise<RoleWithPermissions> {
    return this.prisma.role.update({
      where: { id, tenantId },
      data: {
        status: 'retired',
        deletedAt: new Date(),
      },
      include: roleInclude,
    });
  }

  private buildWhere(tenantId: string, query: NormalizedRoleListQuery): Prisma.RoleWhereInput {
    return {
      OR: [{ tenantId }, { tenantId: null }],
      deletedAt: null,
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { code: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(query: NormalizedRoleListQuery): Prisma.RoleOrderByWithRelationInput {
    const sortMap = {
      name: 'name',
      code: 'code',
      createdAt: 'createdAt',
    } satisfies Record<RoleSortField, keyof Prisma.RoleOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
