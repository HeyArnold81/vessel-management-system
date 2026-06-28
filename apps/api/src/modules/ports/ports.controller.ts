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

import type { PaginatedResponse, PortRecord } from '@vms/shared';

import { CreatePortDto, ListPortsQueryDto, PortIdParamDto } from './dto/create-port.dto.js';
import { UpdatePortDto } from './dto/update-port.dto.js';
import { PortsService } from './ports.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Ports')
@ApiSecurity('tenant')
@Controller('v1/ports')
export class PortsController {
  constructor(@Inject(PortsService) private readonly portsService: PortsService) {}

  @Get()
  @ApiOperation({ summary: 'List ports with search, filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated port list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListPortsQueryDto,
  ): Promise<PaginatedResponse<PortRecord>> {
    return this.portsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one port by id.' })
  @ApiOkResponse({ description: 'Port found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: PortIdParamDto,
  ): Promise<PortRecord> {
    return this.portsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a port.' })
  @ApiCreatedResponse({ description: 'Port created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreatePortDto,
  ): Promise<PortRecord> {
    return this.portsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a port.' })
  @ApiOkResponse({ description: 'Port updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: PortIdParamDto,
    @Body() body: UpdatePortDto,
  ): Promise<PortRecord> {
    return this.portsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a port.' })
  @ApiOkResponse({ description: 'Port soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: PortIdParamDto,
  ): Promise<PortRecord> {
    return this.portsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
