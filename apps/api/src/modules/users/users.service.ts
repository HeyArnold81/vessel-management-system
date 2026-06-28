import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  AssignUserRoleInput,
  CreateUserInput,
  PaginatedResponse,
  UpdateUserInput,
  UserListQuery,
  UserRecord,
} from '@vms/shared';

import { normalizePage, normalizePageSize } from '../../shared/pagination.js';

import { UsersAuditService } from './audit.service.js';
import { toUserRecord } from './user.mapper.js';
import { USERS_REPOSITORY, type UsersRepository } from './users.repository.js';

type UserAuditRecorder = Pick<UsersAuditService, 'record'>;

export const USER_AUDIT_RECORDER = Symbol('USER_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'displayName',
  sortDirection: 'asc',
} as const;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
    @Inject(USER_AUDIT_RECORDER)
    private readonly auditService: UserAuditRecorder,
  ) {}

  async list(tenantId: string, query: UserListQuery): Promise<PaginatedResponse<UserRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      page: normalizePage(query.page, defaultQuery.page),
      pageSize: normalizePageSize(query.pageSize, defaultQuery.pageSize),
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.users.map(toUserRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<UserRecord> {
    const user = await this.repository.findById(tenantId, id);

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return toUserRecord(user);
  }

  async create(tenantId: string, input: CreateUserInput): Promise<UserRecord> {
    await this.assertEmailAvailable(tenantId, input.email);

    const user = await this.repository.create(tenantId, input);
    const record = toUserRecord(user);

    await this.auditService.record({
      tenantId,
      action: 'user.create',
      entityId: user.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdateUserInput): Promise<UserRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('User was not found.');
    }

    if (input.email && input.email.toLowerCase() !== existing.email) {
      await this.assertEmailAvailable(tenantId, input.email, id);
    }

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toUserRecord(existing);
    const afterRecord = toUserRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'user.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async deactivate(tenantId: string, id: string): Promise<UserRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('User was not found.');
    }

    const deactivated = await this.repository.deactivate(tenantId, id);
    const beforeRecord = toUserRecord(existing);
    const afterRecord = toUserRecord(deactivated);

    await this.auditService.record({
      tenantId,
      action: 'user.deactivate',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async assignRole(tenantId: string, id: string, input: AssignUserRoleInput): Promise<UserRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('User was not found.');
    }

    const role = await this.repository.findAssignableRole(tenantId, input.roleId);

    if (!role) {
      throw new NotFoundException('Role was not found.');
    }

    const updated = await this.repository.assignRole(tenantId, id, input.roleId);
    const beforeRecord = toUserRecord(existing);
    const afterRecord = toUserRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'user.role.assign',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async removeRole(tenantId: string, id: string, roleId: string): Promise<UserRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('User was not found.');
    }

    const updated = await this.repository.removeRole(tenantId, id, roleId);
    const beforeRecord = toUserRecord(existing);
    const afterRecord = toUserRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'user.role.remove',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertEmailAvailable(
    tenantId: string,
    email: string,
    currentUserId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByEmail(tenantId, email);

    if (existing && existing.id !== currentUserId) {
      throw new ConflictException('A user with this email already exists.');
    }
  }
}
