import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { PaginatedResponse, PermissionRecord, RoleRecord } from '@vms/shared';

import {
  CreateRoleDto,
  ListPermissionsQueryDto,
  ListRolesQueryDto,
  RoleIdParamDto,
  UpdateRoleDto,
} from './dto/create-role.dto.js';
import { RolesService } from './roles.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Roles')
@ApiSecurity('tenant')
@Controller('v1/roles')
export class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List roles with search, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated role list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListRolesQueryDto,
  ): Promise<PaginatedResponse<RoleRecord>> {
    return this.rolesService.list(requireTenantId(tenantHeader), query);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permission catalogue.' })
  @ApiOkResponse({ description: 'Permission list.' })
  listPermissions(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() _query: ListPermissionsQueryDto,
  ): Promise<readonly PermissionRecord[]> {
    requireTenantId(tenantHeader);
    return this.rolesService.listPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one role by id.' })
  @ApiOkResponse({ description: 'Role found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: RoleIdParamDto,
  ): Promise<RoleRecord> {
    return this.rolesService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a tenant role.' })
  @ApiCreatedResponse({ description: 'Role created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateRoleDto,
  ): Promise<RoleRecord> {
    return this.rolesService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant role.' })
  @ApiOkResponse({ description: 'Role updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: RoleIdParamDto,
    @Body() body: UpdateRoleDto,
  ): Promise<RoleRecord> {
    return this.rolesService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retire a tenant role.' })
  @ApiOkResponse({ description: 'Role retired.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: RoleIdParamDto,
  ): Promise<RoleRecord> {
    return this.rolesService.remove(requireTenantId(tenantHeader), params.id);
  }
}
