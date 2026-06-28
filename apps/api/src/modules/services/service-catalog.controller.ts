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

import type { PaginatedResponse, ServiceCatalogRecord } from '@vms/shared';

import {
  CreateServiceCatalogDto,
  ListServiceCatalogQueryDto,
  ServiceCatalogIdParamDto,
} from './dto/create-service-catalog.dto.js';
import { UpdateServiceCatalogDto } from './dto/update-service-catalog.dto.js';
import { ServiceCatalogService } from './service-catalog.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Services')
@ApiSecurity('tenant')
@Controller('v1/services')
export class ServiceCatalogController {
  constructor(
    @Inject(ServiceCatalogService)
    private readonly serviceCatalogService: ServiceCatalogService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List service catalog items with search, filtering, sorting, and pagination.',
  })
  @ApiOkResponse({ description: 'Paginated service catalog list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListServiceCatalogQueryDto,
  ): Promise<PaginatedResponse<ServiceCatalogRecord>> {
    return this.serviceCatalogService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one service catalog item by id.' })
  @ApiOkResponse({ description: 'Service found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: ServiceCatalogIdParamDto,
  ): Promise<ServiceCatalogRecord> {
    return this.serviceCatalogService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a service catalog item.' })
  @ApiCreatedResponse({ description: 'Service created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateServiceCatalogDto,
  ): Promise<ServiceCatalogRecord> {
    return this.serviceCatalogService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service catalog item.' })
  @ApiOkResponse({ description: 'Service updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: ServiceCatalogIdParamDto,
    @Body() body: UpdateServiceCatalogDto,
  ): Promise<ServiceCatalogRecord> {
    return this.serviceCatalogService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a service catalog item.' })
  @ApiOkResponse({ description: 'Service soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: ServiceCatalogIdParamDto,
  ): Promise<ServiceCatalogRecord> {
    return this.serviceCatalogService.remove(requireTenantId(tenantHeader), params.id);
  }
}
