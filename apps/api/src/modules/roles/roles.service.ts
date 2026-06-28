import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateRoleInput,
  PaginatedResponse,
  PermissionRecord,
  RoleListQuery,
  RoleRecord,
  UpdateRoleInput,
} from '@vms/shared';

import { RolesAuditService } from './audit.service.js';
import { toPermissionRecord, toRoleRecord } from './role.mapper.js';
import { ROLES_REPOSITORY, type RolesRepository } from './roles.repository.js';

type RoleAuditRecorder = Pick<RolesAuditService, 'record'>;

export const ROLE_AUDIT_RECORDER = Symbol('ROLE_AUDIT_RECORDER');

const defaultQuery = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'name',
  sortDirection: 'asc',
} as const;

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly repository: RolesRepository,
    @Inject(ROLE_AUDIT_RECORDER)
    private readonly auditService: RoleAuditRecorder,
  ) {}

  async list(tenantId: string, query: RoleListQuery): Promise<PaginatedResponse<RoleRecord>> {
    const normalizedQuery = {
      ...defaultQuery,
      ...query,
      search: query.search?.trim() ?? '',
      page: query.page ?? defaultQuery.page,
      pageSize: query.pageSize ?? defaultQuery.pageSize,
      sortBy: query.sortBy ?? defaultQuery.sortBy,
      sortDirection: query.sortDirection ?? defaultQuery.sortDirection,
    };

    const result = await this.repository.findPage(tenantId, normalizedQuery);

    return {
      data: result.roles.map(toRoleRecord),
      meta: {
        page: normalizedQuery.page,
        pageSize: normalizedQuery.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.max(1, Math.ceil(result.totalItems / normalizedQuery.pageSize)),
      },
    };
  }

  async listPermissions(): Promise<readonly PermissionRecord[]> {
    const permissions = await this.repository.listPermissions();

    return permissions.map(toPermissionRecord);
  }

  async getById(tenantId: string, id: string): Promise<RoleRecord> {
    const role = await this.repository.findById(tenantId, id);

    if (!role) {
      throw new NotFoundException('Role was not found.');
    }

    return toRoleRecord(role);
  }

  async create(tenantId: string, input: CreateRoleInput): Promise<RoleRecord> {
    const existing = await this.repository.findTenantRoleByCode(tenantId, input.code);

    if (existing) {
      throw new ConflictException('A role with this code already exists.');
    }

    await this.assertPermissionsExist(input.permissionIds ?? []);

    const role = await this.repository.create(tenantId, input);
    const record = toRoleRecord(role);

    await this.auditService.record({
      tenantId,
      action: 'role.create',
      entityId: role.id,
      afterData: record,
    });

    return record;
  }

  async update(tenantId: string, id: string, input: UpdateRoleInput): Promise<RoleRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Role was not found.');
    }

    if (existing.isSystemRole || existing.tenantId === null) {
      throw new ConflictException('System roles cannot be modified.');
    }

    await this.assertPermissionsExist(input.permissionIds ?? []);

    const updated = await this.repository.update(tenantId, id, input);
    const beforeRecord = toRoleRecord(existing);
    const afterRecord = toRoleRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'role.update',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  async remove(tenantId: string, id: string): Promise<RoleRecord> {
    const existing = await this.repository.findById(tenantId, id);

    if (!existing) {
      throw new NotFoundException('Role was not found.');
    }

    if (existing.isSystemRole || existing.tenantId === null) {
      throw new ConflictException('System roles cannot be deleted.');
    }

    const deleted = await this.repository.softDelete(tenantId, id);
    const beforeRecord = toRoleRecord(existing);
    const afterRecord = toRoleRecord(deleted);

    await this.auditService.record({
      tenantId,
      action: 'role.delete',
      entityId: id,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async assertPermissionsExist(permissionIds: readonly string[]): Promise<void> {
    const uniquePermissionIds = [...new Set(permissionIds)];

    if (uniquePermissionIds.length === 0) {
      return;
    }

    const permissions = await this.repository.findPermissions(uniquePermissionIds);

    if (permissions.length !== uniquePermissionIds.length) {
      throw new NotFoundException('One or more permissions were not found.');
    }
  }
}
