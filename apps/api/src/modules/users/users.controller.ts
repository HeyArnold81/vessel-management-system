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

import type { PaginatedResponse, UserRecord } from '@vms/shared';

import {
  AssignUserRoleDto,
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
  UserIdParamDto,
  UserRoleParamDto,
} from './dto/create-user.dto.js';
import { requireTenantId } from './tenant-context.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiSecurity('tenant')
@Controller('v1/users')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with search, filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated user list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedResponse<UserRecord>> {
    return this.usersService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one user by id.' })
  @ApiOkResponse({ description: 'User found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: UserIdParamDto,
  ): Promise<UserRecord> {
    return this.usersService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create or invite a local MVP user.' })
  @ApiCreatedResponse({ description: 'User created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateUserDto,
  ): Promise<UserRecord> {
    return this.usersService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user.' })
  @ApiOkResponse({ description: 'User updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: UserIdParamDto,
    @Body() body: UpdateUserDto,
  ): Promise<UserRecord> {
    return this.usersService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user.' })
  @ApiOkResponse({ description: 'User deactivated.' })
  deactivate(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: UserIdParamDto,
  ): Promise<UserRecord> {
    return this.usersService.deactivate(requireTenantId(tenantHeader), params.id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign a role to a user.' })
  @ApiOkResponse({ description: 'Role assigned.' })
  assignRole(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: UserIdParamDto,
    @Body() body: AssignUserRoleDto,
  ): Promise<UserRecord> {
    return this.usersService.assignRole(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a role from a user.' })
  @ApiOkResponse({ description: 'Role removed.' })
  removeRole(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: UserRoleParamDto,
  ): Promise<UserRecord> {
    return this.usersService.removeRole(requireTenantId(tenantHeader), params.id, params.roleId);
  }
}
