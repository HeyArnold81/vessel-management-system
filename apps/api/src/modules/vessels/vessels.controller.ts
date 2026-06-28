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

import type { PaginatedResponse, VesselRecord } from '@vms/shared';

import { CreateVesselDto, ListVesselsQueryDto, VesselIdParamDto } from './dto/create-vessel.dto.js';
import { UpdateVesselDto } from './dto/update-vessel.dto.js';
import { requireTenantId } from './tenant-context.js';
import { VesselsService } from './vessels.service.js';

@ApiTags('Vessels')
@ApiSecurity('tenant')
@Controller('v1/vessels')
export class VesselsController {
  constructor(@Inject(VesselsService) private readonly vesselsService: VesselsService) {}

  @Get()
  @ApiOperation({ summary: 'List vessels with search, filtering, sorting, and pagination.' })
  @ApiOkResponse({ description: 'Paginated vessel list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListVesselsQueryDto,
  ): Promise<PaginatedResponse<VesselRecord>> {
    return this.vesselsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one vessel by id.' })
  @ApiOkResponse({ description: 'Vessel found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselIdParamDto,
  ): Promise<VesselRecord> {
    return this.vesselsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vessel.' })
  @ApiCreatedResponse({ description: 'Vessel created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateVesselDto,
  ): Promise<VesselRecord> {
    return this.vesselsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vessel.' })
  @ApiOkResponse({ description: 'Vessel updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselIdParamDto,
    @Body() body: UpdateVesselDto,
  ): Promise<VesselRecord> {
    return this.vesselsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a vessel.' })
  @ApiOkResponse({ description: 'Vessel soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselIdParamDto,
  ): Promise<VesselRecord> {
    return this.vesselsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
