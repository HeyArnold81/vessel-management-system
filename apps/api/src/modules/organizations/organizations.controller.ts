import { Controller, Get, Headers, Inject, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import type { OrganizationRecord, PaginatedResponse } from '@vms/shared';

import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto.js';
import { OrganizationsService } from './organizations.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Organizations')
@ApiSecurity('tenant')
@Controller('v1/organizations')
export class OrganizationsController {
  constructor(
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tenant organizations for operational and billing party lookup.' })
  @ApiOkResponse({ description: 'Paginated organization list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListOrganizationsQueryDto,
  ): Promise<PaginatedResponse<OrganizationRecord>> {
    return this.organizationsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one organization by id.' })
  @ApiOkResponse({ description: 'Organization found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<OrganizationRecord> {
    return this.organizationsService.getById(requireTenantId(tenantHeader), id);
  }
}
