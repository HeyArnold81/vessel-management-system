import { Body, Controller, Get, Headers, Inject, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import type {
  PermissionGroupRecord,
  PermissionMatrixRecord,
  PermissionRecord,
  RoleRecord,
} from '@vms/shared';

import { RoleIdParamDto, UpdateRolePermissionsDto } from './dto/update-role-permissions.dto.js';
import { PermissionsService } from './permissions.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Permissions')
@ApiSecurity('tenant')
@Controller('v1/permissions')
export class PermissionsController {
  constructor(
    @Inject(PermissionsService)
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the permission catalogue.' })
  @ApiOkResponse({ description: 'Permission catalogue.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
  ): Promise<readonly PermissionRecord[]> {
    requireTenantId(tenantHeader);
    return this.permissionsService.listPermissions();
  }

  @Get('groups')
  @ApiOperation({ summary: 'List permission groups with their permissions.' })
  @ApiOkResponse({ description: 'Grouped permission catalogue.' })
  listGroups(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
  ): Promise<readonly PermissionGroupRecord[]> {
    requireTenantId(tenantHeader);
    return this.permissionsService.listGroups();
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Return role-to-permission matrix for administration UI.' })
  @ApiOkResponse({ description: 'Permission matrix.' })
  getMatrix(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
  ): Promise<PermissionMatrixRecord> {
    return this.permissionsService.getMatrix(requireTenantId(tenantHeader));
  }

  @Put('roles/:roleId')
  @ApiOperation({ summary: 'Replace a tenant role permission set.' })
  @ApiOkResponse({ description: 'Role permissions updated.' })
  updateRolePermissions(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: RoleIdParamDto,
    @Body() body: UpdateRolePermissionsDto,
  ): Promise<RoleRecord> {
    return this.permissionsService.updateRolePermissions(
      requireTenantId(tenantHeader),
      params.roleId,
      body,
    );
  }
}
