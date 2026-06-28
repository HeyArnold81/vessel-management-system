import { Controller, Get, Headers, Inject, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

import type { ReportsOverviewRecord } from '@vms/shared';

import { ReportOverviewQueryDto } from './dto/report-query.dto.js';
import { ReportsService } from './reports.service.js';
import { requireTenantId } from './tenant-context.js';

@ApiTags('Reports')
@ApiSecurity('tenant')
@Controller('v1/reports')
export class ReportsController {
  constructor(
    @Inject(ReportsService)
    private readonly reportsService: ReportsService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Return operational and billing report overview.' })
  @ApiOkResponse({ description: 'Report overview.' })
  getOverview(
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Query() query: ReportOverviewQueryDto,
  ): Promise<ReportsOverviewRecord> {
    return this.reportsService.getOverview(requireTenantId(tenantHeader), query);
  }
}
