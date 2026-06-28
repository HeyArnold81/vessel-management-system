import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type {
  PermissionGroupRecord,
  PermissionMatrixRecord,
  PermissionRecord,
  RoleRecord,
  UpdateRolePermissionsInput,
} from '@vms/shared';

import { PermissionsAuditService } from './audit.service.js';
import {
  toPermissionGroupRecord,
  toPermissionMatrixRecord,
  toPermissionRecord,
  toRoleRecord,
} from './permission.mapper.js';
import { PERMISSIONS_REPOSITORY, type PermissionsRepository } from './permissions.repository.js';

type PermissionAuditRecorder = Pick<PermissionsAuditService, 'record'>;

export const PERMISSION_AUDIT_RECORDER = Symbol('PERMISSION_AUDIT_RECORDER');

@Injectable()
export class PermissionsService {
  constructor(
    @Inject(PERMISSIONS_REPOSITORY)
    private readonly repository: PermissionsRepository,
    @Inject(PERMISSION_AUDIT_RECORDER)
    private readonly auditService: PermissionAuditRecorder,
  ) {}

  async listPermissions(): Promise<readonly PermissionRecord[]> {
    const permissions = await this.repository.listPermissions();

    return permissions.map(toPermissionRecord);
  }

  async listGroups(): Promise<readonly PermissionGroupRecord[]> {
    return this.buildGroups();
  }

  async getMatrix(tenantId: string): Promise<PermissionMatrixRecord> {
    const [groups, roles] = await Promise.all([
      this.buildGroups(),
      this.repository.listMatrixRoles(tenantId),
    ]);

    return toPermissionMatrixRecord(groups, roles);
  }

  async updateRolePermissions(
    tenantId: string,
    roleId: string,
    input: UpdateRolePermissionsInput,
  ): Promise<RoleRecord> {
    const existing = await this.repository.findRoleById(tenantId, roleId);

    if (!existing) {
      throw new NotFoundException('Role was not found.');
    }

    if (existing.isSystemRole || existing.tenantId === null) {
      throw new ConflictException('System roles cannot be modified.');
    }

    await this.assertPermissionsExist(input.permissionIds);

    const updated = await this.repository.updateRolePermissions(
      tenantId,
      roleId,
      input.permissionIds,
    );
    const beforeRecord = toRoleRecord(existing);
    const afterRecord = toRoleRecord(updated);

    await this.auditService.record({
      tenantId,
      action: 'permission.role.update',
      entityId: roleId,
      beforeData: beforeRecord,
      afterData: afterRecord,
    });

    return afterRecord;
  }

  private async buildGroups(): Promise<readonly PermissionGroupRecord[]> {
    const [groups, permissions] = await Promise.all([
      this.repository.listGroups(),
      this.repository.listPermissions(),
    ]);
    const groupedPermissionIds = new Set(
      groups.flatMap((group) => group.permissions.map((permission) => permission.id)),
    );
    const ungroupedPermissions = permissions.filter(
      (permission) => !groupedPermissionIds.has(permission.id),
    );
    const records = groups.map(toPermissionGroupRecord);

    if (ungroupedPermissions.length === 0) {
      return records;
    }

    return [
      ...records,
      {
        id: 'ungrouped',
        code: 'ungrouped',
        name: 'Ungrouped',
        description: 'Permissions awaiting catalogue grouping.',
        sortOrder: 999,
        permissions: ungroupedPermissions.map(toPermissionRecord),
      },
    ];
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
