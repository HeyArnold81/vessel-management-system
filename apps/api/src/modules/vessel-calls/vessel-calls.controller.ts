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

import type { PaginatedResponse, VesselCallRecord } from '@vms/shared';

import {
  CreateVesselCallDto,
  ListVesselCallsQueryDto,
  VesselCallIdParamDto,
} from './dto/create-vessel-call.dto.js';
import { UpdateVesselCallDto } from './dto/update-vessel-call.dto.js';
import { requireTenantId } from './tenant-context.js';
import { VesselCallsService } from './vessel-calls.service.js';

@ApiTags('Vessel Calls')
@ApiSecurity('tenant')
@Controller('v1/vessel-calls')
export class VesselCallsController {
  constructor(
    @Inject(VesselCallsService) private readonly vesselCallsService: VesselCallsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List vessel calls with search, filtering, sorting, and pagination.',
  })
  @ApiOkResponse({ description: 'Paginated vessel call list.' })
  list(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ListVesselCallsQueryDto,
  ): Promise<PaginatedResponse<VesselCallRecord>> {
    return this.vesselCallsService.list(requireTenantId(tenantHeader), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one vessel call by id.' })
  @ApiOkResponse({ description: 'Vessel call found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselCallIdParamDto,
  ): Promise<VesselCallRecord> {
    return this.vesselCallsService.getById(requireTenantId(tenantHeader), params.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vessel call.' })
  @ApiCreatedResponse({ description: 'Vessel call created.' })
  create(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: CreateVesselCallDto,
  ): Promise<VesselCallRecord> {
    return this.vesselCallsService.create(requireTenantId(tenantHeader), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vessel call.' })
  @ApiOkResponse({ description: 'Vessel call updated.' })
  update(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselCallIdParamDto,
    @Body() body: UpdateVesselCallDto,
  ): Promise<VesselCallRecord> {
    return this.vesselCallsService.update(requireTenantId(tenantHeader), params.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a vessel call.' })
  @ApiOkResponse({ description: 'Vessel call soft deleted.' })
  remove(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: VesselCallIdParamDto,
  ): Promise<VesselCallRecord> {
    return this.vesselCallsService.remove(requireTenantId(tenantHeader), params.id);
  }
}
