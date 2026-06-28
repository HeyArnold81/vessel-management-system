import { Injectable } from '@nestjs/common';
import type { Prisma, Role } from '@prisma/client';

import type {
  AuthProvider,
  CreateUserInput,
  SortDirection,
  UpdateUserInput,
  UserSortField,
  UserStatus,
} from '@vms/shared';

import { PrismaService } from '../../database/prisma.service.js';
import type { UserWithRoles } from './user.mapper.js';

export type UserPageResult = {
  readonly users: readonly UserWithRoles[];
  readonly totalItems: number;
};

export type NormalizedUserListQuery = {
  readonly page: number;
  readonly pageSize: number;
  readonly search: string;
  readonly status?: UserStatus;
  readonly authProvider?: AuthProvider;
  readonly sortBy: UserSortField;
  readonly sortDirection: SortDirection;
};

export interface UsersRepository {
  findPage(tenantId: string, query: NormalizedUserListQuery): Promise<UserPageResult>;
  findById(tenantId: string, id: string): Promise<UserWithRoles | null>;
  findByEmail(tenantId: string, email: string): Promise<UserWithRoles | null>;
  findAssignableRole(tenantId: string, roleId: string): Promise<Role | null>;
  create(tenantId: string, input: CreateUserInput): Promise<UserWithRoles>;
  update(tenantId: string, id: string, input: UpdateUserInput): Promise<UserWithRoles>;
  deactivate(tenantId: string, id: string): Promise<UserWithRoles>;
  assignRole(tenantId: string, userId: string, roleId: string): Promise<UserWithRoles>;
  removeRole(tenantId: string, userId: string, roleId: string): Promise<UserWithRoles>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

const userInclude = {
  roles: { include: { role: true }, orderBy: { assignedAt: 'asc' } },
} satisfies Prisma.UserInclude;

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(tenantId: string, query: NormalizedUserListQuery): Promise<UserPageResult> {
    const where = this.buildWhere(tenantId, query);
    const orderBy = this.buildOrderBy(query);

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, totalItems };
  }

  findById(tenantId: string, id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: userInclude,
    });
  }

  findByEmail(tenantId: string, email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, email: email.trim().toLowerCase(), deletedAt: null },
      include: userInclude,
    });
  }

  findAssignableRole(tenantId: string, roleId: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { id: roleId, OR: [{ tenantId }, { tenantId: null }] },
    });
  }

  create(tenantId: string, input: CreateUserInput): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: {
        tenantId,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        authProvider: input.authProvider ?? 'local',
        externalSubject: input.externalSubject?.trim() || null,
        status: input.status ?? 'invited',
      },
      include: userInclude,
    });
  }

  update(tenantId: string, id: string, input: UpdateUserInput): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id, tenantId },
      data: {
        ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
        ...(input.authProvider !== undefined ? { authProvider: input.authProvider } : {}),
        ...(input.externalSubject !== undefined
          ? { externalSubject: input.externalSubject?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: userInclude,
    });
  }

  deactivate(tenantId: string, id: string): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id, tenantId },
      data: {
        status: 'deactivated',
        deletedAt: new Date(),
      },
      include: userInclude,
    });
  }

  async assignRole(tenantId: string, userId: string, roleId: string): Promise<UserWithRoles> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });

    const user = await this.findById(tenantId, userId);
    if (!user) {
      throw new Error('User role assignment failed.');
    }
    return user;
  }

  async removeRole(tenantId: string, userId: string, roleId: string): Promise<UserWithRoles> {
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });

    const user = await this.findById(tenantId, userId);
    if (!user) {
      throw new Error('User role removal failed.');
    }
    return user;
  }

  private buildWhere(tenantId: string, query: NormalizedUserListQuery): Prisma.UserWhereInput {
    return {
      tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.authProvider ? { authProvider: query.authProvider } : {}),
      ...(query.search
        ? {
            OR: [
              { displayName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(query: NormalizedUserListQuery): Prisma.UserOrderByWithRelationInput {
    const sortMap = {
      displayName: 'displayName',
      email: 'email',
      status: 'status',
      createdAt: 'createdAt',
    } satisfies Record<UserSortField, keyof Prisma.UserOrderByWithRelationInput>;

    return { [sortMap[query.sortBy]]: query.sortDirection };
  }
}
