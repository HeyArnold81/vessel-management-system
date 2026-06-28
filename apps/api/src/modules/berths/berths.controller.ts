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

import type { BerthRecord, PaginatedResponse } from '@vms/shared';

import { BerthsService } from './berths.service.js';
import { BerthIdParamDto, CreateBerthDto, ListBerthsQueryDto } from './dto/create-berth.dto.js';
import { UpdateBerthDto } from './dto/update-berth.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Berths')
@ApiSecurity('tenant')
@Controller('v1/berths')
export class BerthsController {
  constructor(@Inject(BerthsService) private readonly berthsService: BerthsService) {}

  @Get()
  @ApiOperation({ summary: 'List berths with search, filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated berth list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListBerthsQueryDto,
  ): Promise<PaginatedResponse<BerthRecord>> {
    return this.berthsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one berth by id.' })
  @ApiOkResponse({ description: 'Berth found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BerthIdParamDto,
  ): Promise<BerthRecord> {
    return this.berthsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a berth.' })
  @ApiCreatedResponse({ description: 'Berth created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateBerthDto,
  ): Promise<BerthRecord> {
    return this.berthsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a berth.' })
  @ApiOkResponse({ description: 'Berth updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BerthIdParamDto,
    @Body() body: UpdateBerthDto,
  ): Promise<BerthRecord> {
    return this.berthsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a berth.' })
  @ApiOkResponse({ description: 'Berth soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: BerthIdParamDto,
  ): Promise<BerthRecord> {
    return this.berthsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
