import { Body, Controller, Get, Headers, Inject, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

import type { AvailabilityCheckRecord } from '@vms/shared';

import { AvailabilityService } from './availability.service.js';
import { AvailabilityCheckDto, AvailabilityCheckIdParamDto } from './dto/availability.dto.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Availability')
@ApiSecurity('tenant')
@Controller('v1/availability')
export class AvailabilityController {
  constructor(
    @Inject(AvailabilityService) private readonly availabilityService: AvailabilityService,
  ) {}

  @Post('check')
  @ApiOperation({ summary: 'Run an advisory berth and service availability check.' })
  @ApiCreatedResponse({ description: 'Availability check created.' })
  check(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() body: AvailabilityCheckDto,
  ): Promise<AvailabilityCheckRecord> {
    return this.availabilityService.check(requireTenantId(tenantHeader), body);
  }

  @Get('checks/:id')
  @ApiOperation({ summary: 'Get one availability check by id.' })
  @ApiOkResponse({ description: 'Availability check found.' })
  getById(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Param() params: AvailabilityCheckIdParamDto,
  ): Promise<AvailabilityCheckRecord> {
    return this.availabilityService.getById(requireTenantId(tenantHeader), params.id);
  }
}
